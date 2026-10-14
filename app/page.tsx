"use client";

import { useState, useMemo } from "react";
import courses from "../data/courses";

// 강좌별 대표 아이콘 매핑 헬퍼
const COURSE_ICONS: Record<string, string> = {
  "ai-automation": "🤖",
  "short-form": "🎬",
  "excel-business": "📊",
  "smart-store": "🛍️",
  "blog-monetization": "✍️",
};

// 예약 모달에 넘길 강좌 정보 타입
interface ReservationTarget {
  id: string;
  name: string;
  date: string;
  remainingSeats: number; // 잔여 좌석 (인원 초과 검사용)
}

// 제출 결과 상태
type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // 모달 상태 관리
  const [modalCourse, setModalCourse] = useState<ReservationTarget | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", people: "1" });
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  // 예약 가능한 강좌만 필터링 (남은 좌석 > 0)
  const displayedCourses = useMemo(() => {
    if (!onlyAvailable) return courses;
    return courses.filter((course) => course.seat - course.booked > 0);
  }, [onlyAvailable]);

  // 모달 열기
  function openModal(course: ReservationTarget) {
    setForm({ name: "", phone: "", people: "1" });
    setSubmitStatus("idle");
    setSubmitMessage("");
    setModalCourse(course);
  }

  // 모달 닫기
  function closeModal() {
    setModalCourse(null);
  }

  // 배경 클릭 시 닫기
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) closeModal();
  }

  // 신청 제출
  async function handleSubmit() {
    if (!modalCourse) return;

    // ── 클라이언트 유효성 검사 ──
    if (!form.name.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("이름을 입력해 주세요.");
      return;
    }
    if (!form.phone.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("연락처를 입력해 주세요.");
      return;
    }
    const peopleNum = Number(form.people);
    if (!peopleNum || peopleNum < 1) {
      setSubmitStatus("error");
      setSubmitMessage("인원은 1명 이상이어야 합니다.");
      return;
    }
    if (peopleNum > modalCourse.remainingSeats) {
      setSubmitStatus("error");
      setSubmitMessage(
        `잔여 좌석(${modalCourse.remainingSeats}석)보다 많은 인원은 신청할 수 없습니다.`
      );
      return;
    }

    // ── API 전송 ──
    setSubmitStatus("loading");
    setSubmitMessage("");
    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: modalCourse.id,
          date: modalCourse.date,
          course: modalCourse.name,
          name: form.name.trim(),
          phone: form.phone.trim(),
          people: peopleNum,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSubmitStatus("success");
        setSubmitMessage("예약 신청이 완료되었습니다");
      } else {
        setSubmitStatus("error");
        setSubmitMessage(data.error ?? "신청 중 오류가 발생했습니다.");
      }
    } catch {
      setSubmitStatus("error");
      setSubmitMessage("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070d1e] text-white px-4 py-8 sm:px-8 sm:py-12 relative overflow-hidden font-sans">
      {/* 럭셔리 골드 & 네이비 배경 글로우 효과 */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 상단 네비게이션 */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 pb-6 border-b border-amber-500/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-lg">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            스킬투머니
            <span className="text-xs px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 font-medium">
              Skill to Money
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-300 backdrop-blur-md border border-amber-500/30 shadow-sm">
            ✨ 프리미엄 실전 클래스 ({courses.length}개 과정)
          </span>
        </div>
      </header>

      {/* 메인 콘텐츠 영역: 강좌 목록 */}
      <main className="w-full max-w-7xl mx-auto my-auto py-10 sm:py-14 z-10">
        {/* 섹션 타이틀 헤더 */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs sm:text-sm font-medium mb-4">
            <span>⚡</span>
            <span>배운 기술이 바로 수익이 되는 실전 원데이 클래스</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            스킬투머니 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">강좌 목록</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed break-keep">
            단 하루의 몰입으로 검증된 실전 노하우를 배우고 나만의 수익 파이프라인을 만들어 보세요.
          </p>
        </div>

        {/* 필터 컨트롤 바 (강좌 목록 위) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#0e1933]/80 border border-amber-500/20 backdrop-blur-md rounded-2xl p-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              전체 <strong className="text-amber-300">{courses.length}</strong>개 강좌 중{" "}
              <strong className="text-amber-400">{displayedCourses.length}</strong>개 표시 중
            </span>
          </div>

          {/* 예약 가능한 강좌만 보기 체크 상자 */}
          <label className="group flex items-center gap-3 cursor-pointer select-none bg-[#142347] hover:bg-[#1a2d5a] px-4 py-2 rounded-xl border border-amber-500/30 hover:border-amber-400/60 transition-all">
            <input
              type="checkbox"
              id="filter-available"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-400 cursor-pointer text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
            />
            <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
              예약 가능한 강좌만 보기
            </span>
            {onlyAvailable && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                필터 적용 중
              </span>
            )}
          </label>
        </div>

        {/* 강좌 카드 그리드 */}
        {displayedCourses.length === 0 ? (
          <div className="text-center py-16 bg-[#0f1b36]/60 rounded-3xl border border-white/10">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-white mb-1">예약 가능한 강좌가 없습니다</h3>
            <p className="text-sm text-slate-400 mb-4">체크를 해제하면 전체 강좌를 다시 확인할 수 있습니다.</p>
            <button
              type="button"
              onClick={() => setOnlyAvailable(false)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              전체 강좌 보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {displayedCourses.map((course) => {
              const remainingSeats = course.seat - course.booked;
              const isSoldOut = remainingSeats <= 0;
              const isUrgent = remainingSeats >= 1 && remainingSeats <= 2;
              const icon = COURSE_ICONS[course.id] || "📚";

              return (
                <div
                  key={course.id}
                  className="group relative flex flex-col justify-between rounded-3xl bg-[#0f1b36]/90 border border-amber-500/20 hover:border-amber-400/60 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/15"
                >
                  {/* 상단 골드 하이라이트 라인 */}
                  <div className="absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 group-hover:via-amber-400 to-transparent transition-all duration-300" />

                  <div>
                    {/* 뱃지 & 아이콘 */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl p-2.5 rounded-2xl bg-[#16254a] border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                        {icon}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isSoldOut ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            마감
                          </span>
                        ) : isUrgent ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                            마감 임박 ({remainingSeats}자리 남음)
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            모집중
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 강좌 이름 */}
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                      {course.name}
                    </h2>

                    {/* 강좌 태그 배지 목록 (이름 바로 아래) */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                      {course.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/25 shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* 일정 정보 */}
                    <div className="flex items-center gap-1.5 text-xs text-amber-200/80 mb-4 bg-amber-400/5 px-2.5 py-1.5 rounded-lg border border-amber-400/10">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>개강일: {course.date}</span>
                    </div>

                    {/* 좌석 현황 영역 */}
                    <div className="mb-5 p-3 rounded-xl bg-[#142347]/80 border border-amber-500/15 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSoldOut
                              ? "bg-rose-500"
                              : isUrgent
                              ? "bg-red-500 animate-ping"
                              : "bg-emerald-400 animate-pulse"
                          }`}
                        />
                        좌석 현황
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                        <span>
                          잔여{" "}
                          <strong
                            className={
                              isSoldOut
                                ? "text-rose-400 font-bold"
                                : isUrgent
                                ? "text-red-400 font-bold"
                                : "text-amber-400 font-bold"
                            }
                          >
                            {remainingSeats}석
                          </strong>{" "}
                          / 정원 {course.seat}명
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 하단 가격 & 예약하기 버튼 */}
                  <div className="pt-5 border-t border-amber-500/15">
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-xs font-medium text-slate-400">수강료</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-amber-400 tracking-tight">
                          {course.price.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-amber-200/90 ml-1">원</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() =>
                        !isSoldOut &&
                        openModal({
                          id: course.id,
                          name: course.name,
                          date: course.date,
                          remainingSeats,
                        })
                      }
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        isSoldOut
                          ? "bg-slate-800/90 text-slate-400 border border-slate-700 cursor-not-allowed opacity-75 select-none"
                          : "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer"
                      }`}
                    >
                      <span>{isSoldOut ? "예약 마감" : "예약하기"}</span>
                      {!isSoldOut && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 하단 푸터 영역 */}
      <footer className="w-full max-w-7xl mx-auto text-center text-xs text-slate-500 py-6 border-t border-white/5 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 스킬투머니 (SkillToMoney). All rights reserved.</p>
        <p className="text-slate-400">문의: support@skilltomoney.com</p>
      </footer>

      {/* ──────────────── 예약 신청 모달 ──────────────── */}
      {modalCourse && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(4, 8, 20, 0.80)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-[#0e1933] shadow-2xl shadow-amber-500/10 overflow-hidden"
            style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            {/* 상단 골드 그라디언트 장식 */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-amber-500/15">
              <div>
                <p className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-widest mb-1">
                  예약 신청
                </p>
                <h2 id="modal-title" className="text-xl font-extrabold text-white leading-tight">
                  {modalCourse.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-200/70">
                  <svg className="w-3.5 h-3.5 text-amber-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>개강일: {modalCourse.date}</span>
                </div>
              </div>
              {/* 닫기 X 버튼 */}
              <button
                type="button"
                id="modal-close-x"
                onClick={closeModal}
                aria-label="모달 닫기"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10 hover:border-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 폼 영역 */}
            <div className="px-7 py-6 flex flex-col gap-5">
              {/* 이름 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="res-name" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 이름
                  <span className="text-rose-400 ml-0.5">*</span>
                </label>
                <input
                  id="res-name"
                  type="text"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#142347] border border-amber-500/20 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              {/* 연락처 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="res-phone" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 연락처
                  <span className="text-rose-400 ml-0.5">*</span>
                </label>
                <input
                  id="res-phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-[#142347] border border-amber-500/20 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              {/* 인원 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="res-people" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 인원
                  <span className="text-rose-400 ml-0.5">*</span>
                </label>
                <input
                  id="res-people"
                  type="number"
                  min={1}
                  max={modalCourse.remainingSeats}
                  value={form.people}
                  onChange={(e) => setForm({ ...form, people: e.target.value })}
                  className="w-full bg-[#142347] border border-amber-500/20 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  최대 {modalCourse.remainingSeats}명 신청 가능
                </p>
              </div>

              {/* 자동 채워진 강좌 정보 (읽기 전용) */}
              <div className="rounded-xl bg-[#0b1428] border border-amber-500/15 px-4 py-3 flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">신청 강좌 정보</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">강좌명</span>
                  <span className="font-semibold text-amber-300">{modalCourse.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">날짜</span>
                  <span className="font-semibold text-amber-300">{modalCourse.date}</span>
                </div>
              </div>
            </div>

            {/* 상태 메시지 */}
            {submitStatus === "success" && (
              <div className="mx-7 mb-5 px-4 py-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-sm font-semibold flex flex-col items-center gap-1.5 text-center">
                <span className="text-2xl">🎉</span>
                <span className="text-base font-extrabold text-emerald-300">예약 신청이 완료되었습니다</span>
                <span className="text-xs text-emerald-400/80 font-medium">입력하신 연락처로 안내드리겠습니다.</span>
              </div>
            )}
            {submitStatus === "error" && (
              <div className="mx-7 mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{submitMessage}</span>
              </div>
            )}

            {/* 하단 버튼 영역 */}
            <div className="flex items-center gap-3 px-7 pb-7">
              <button
                type="button"
                id="modal-submit"
                onClick={handleSubmit}
                disabled={submitStatus === "loading" || submitStatus === "success"}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  submitStatus === "loading" || submitStatus === "success"
                    ? "bg-amber-500/40 text-slate-950/60 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer"
                }`}
              >
                {submitStatus === "loading" ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    저장 중…
                  </>
                ) : submitStatus === "success" ? (
                  "✅ 신청 완료"
                ) : (
                  "신청"
                )}
              </button>
              <button
                type="button"
                id="modal-cancel"
                onClick={closeModal}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all duration-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 등장 애니메이션 키프레임 */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
