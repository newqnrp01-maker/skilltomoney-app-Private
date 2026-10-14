import { NextRequest, NextResponse } from "next/server";
import courses from "../../../data/courses";

// 클라이언트가 보내는 요청 바디 타입
interface ReserveRequestBody {
  courseId: string; // 강좌 ID (서버에서 수강료 조회에 사용)
  date: string;
  course: string; // 강좌 이름 (표시용)
  name: string;
  phone: string;
  people: number;
}

export async function POST(request: NextRequest) {
  // 1. 요청 파싱
  let body: ReserveRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { courseId, date, course, name, phone, people } = body;

  // 2. 기본 유효성 검사
  if (!courseId || !name?.trim() || !phone?.trim() || !people || people < 1) {
    return NextResponse.json(
      { ok: false, error: "필수 항목이 누락되었습니다." },
      { status: 400 }
    );
  }

  // 3. 서버 측에서 수강료 조회 → total 계산 (클라이언트 값 무시)
  const found = courses.find((c) => c.id === courseId);
  if (!found) {
    return NextResponse.json(
      { ok: false, error: "존재하지 않는 강좌입니다." },
      { status: 400 }
    );
  }
  const total = found.price * Number(people);

  // 4. SHEET_URL은 서버 환경변수에서만 읽음 (브라우저에 노출되지 않음)
  const sheetUrl = process.env.SHEET_URL;
  if (!sheetUrl) {
    console.error("[reserve] SHEET_URL 환경변수가 설정되지 않았습니다.");
    return NextResponse.json(
      { ok: false, error: "서버 설정 오류입니다. 관리자에게 문의하세요." },
      { status: 500 }
    );
  }

  // 5. Google Apps Script로 데이터 전송
  const payload = { date, course, name, phone, people: Number(people), total };

  let sheetRes: Response;
  try {
    sheetRes = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[reserve] Google Sheets fetch 실패:", err);
    return NextResponse.json(
      { ok: false, error: "시트 서버 연결에 실패했습니다. 잠시 후 다시 시도하세요." },
      { status: 502 }
    );
  }

  // 6. Apps Script 응답 확인 (GAS는 redirect를 따르므로 일반적으로 200 반환)
  if (!sheetRes.ok) {
    const text = await sheetRes.text().catch(() => "");
    console.error("[reserve] Google Sheets 오류 응답:", sheetRes.status, text);
    return NextResponse.json(
      { ok: false, error: "시트 저장에 실패했습니다." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, total });
}
