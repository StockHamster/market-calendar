"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Pencil, Trash } from "lucide-react";
import { useEffect } from "react";
import { sectorStyles } from "@/constants/sectorStyles";
import MarketFlowChart from "@/app/MarketFlowChart"
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase"; // 위에서 만든 파일

const HOLIDAYS: { [key: string]: string } = {
  "2025-06-03": "대통령 선거일",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-06": "추석",
  "2025-10-07": "　　",
  "2025-10-08": "대체공휴일",
  "2025-10-09": "한글날",
  "2025-12-25": "성탄절",
  "2026-01-01": "신년"
};

const TAGS = {
  schedule: [
    { label: "신규상장주", color: "bg-yellow-300" },
    { label: "주요일정", color: "bg-orange-300" },
    { label: "이벤트", color: "bg-rose-500" },
    { label: "보호예수. CB/BW", color: "bg-lime-300" },
    { label: "기타", color: "" }
  ],
  record: [
    { label: "당일 시장 주도주", color: "bg-sky-300" },
    { label: "특징 뉴스", color: "bg-violet-200" },
    { label: "단기과열", textColor: "#ff0000", bgColor: "#ffff00", prefix: "열" },
    { label: "투자주의", textColor: "#ffffff", bgColor: "#91847d", prefix: "주" },
    { label: "투자경고", textColor: "#ffffff", bgColor: "#ab6f6f", prefix: "경" },
    { label: "투자위험", textColor: "#ffffff", bgColor: "#a42d6c", prefix: "위" },
    { label: "거래정지", textColor: "#ffffff", bgColor: "#dd4596", prefix: "정" },
    { label: "기타", color: "" }
  ]
};

interface Note {
  text: string;
  tag: string;
}
type SimpleTag = {
  label: string;
  color: string;
};

type PrefixTag = {
  label: string;
  textColor: string;
  bgColor: string;
  prefix: string;
  color?: string;
};

type TagInfo = SimpleTag | PrefixTag;

type DragSource = {
  key: string;
  index: number;
};

type SectorInfo = {
  섹터: string;
  이모지: string;
};

function hasPrefixField(obj: any): obj is { prefix: string } {
  return obj && typeof obj.prefix === "string";
}
function hasPrefixInfo(tag: any): tag is { prefix: string; bgColor: string; textColor: string } {
  return tag && typeof tag.prefix === "string" && typeof tag.bgColor === "string" && typeof tag.textColor === "string";
}
function isPrefixTag(tag: TagInfo): tag is PrefixTag {
  return (
    typeof tag === "object" &&
    tag !== null &&
    "prefix" in tag &&
    typeof tag.prefix === "string" &&
    typeof tag.bgColor === "string" &&
    typeof tag.textColor === "string"
  );
}
function hasPrefixFields(tag: TagInfo): tag is TagInfo & {
  textColor: string;
  bgColor: string;
  prefix: string;
} {
  return (
    typeof tag === "object" &&
    tag !== null &&
    "prefix" in tag &&
    typeof (tag as any).prefix === "string" &&
    typeof (tag as any).bgColor === "string" &&
    typeof (tag as any).textColor === "string"
  );
}

export default function MarketCalendarApp() {
  const [selectedMarketFlowDate, setSelectedMarketFlowDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<"schedule" | "record">("schedule");
  const [selectedDate, setSelectedDate] = useState(new Date());
  type Notes = {
    [dayKey: string]: Note[];
  };
  const [notes, setNotes] = useState<Notes>({});
  const [tags, setTags] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // const [newNote, setNewNote] = useState("");
  {/*const [selectedTag, setSelectedTag] = useState(
    calendarView === "schedule" ? TAGS.schedule[0].label : TAGS.record[0].label
  );*/}
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [dragSource, setDragSource] = React.useState<DragSource | null>(null);
  const [monthlySector, setMonthlySector] = useState<Record<string, string[]>>({});
  const [top10Sectors, setTop10Sectors] = useState<SectorInfo[]>([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [todayVisitCount, setTodayVisitCount] = useState(0);

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };


    const isHoliday = (date: Date) => {
      const isoKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return (HOLIDAYS as Record<string, string>)[isoKey];
    };

      const hexToRgba = (hex: string, alpha: number = 0.3) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
        
    const isFuture = (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date > today;
    };

    const getPreviousValidDate = (date: Date) => {
      const newDate = new Date(date);
      do {
        newDate.setDate(newDate.getDate() - 1);
      } while (isWeekend(newDate) || isHoliday(newDate));
      return newDate;
    };

    const getNextValidDate = (date: Date) => {
      const newDate = new Date(date);
      do {
        newDate.setDate(newDate.getDate() + 1);
      } while ((isWeekend(newDate) || isHoliday(newDate)) && !isFuture(newDate));
      return isFuture(newDate) ? date : newDate;
    };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedMarketFlowDate) return;

      if (e.key === "ArrowLeft") {
        setSelectedMarketFlowDate(getPreviousValidDate(selectedMarketFlowDate));
      } else if (e.key === "ArrowRight") {
        setSelectedMarketFlowDate(getNextValidDate(selectedMarketFlowDate));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMarketFlowDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedMarketFlowDate) return;

      if (e.key === "ArrowLeft") {
        setSelectedMarketFlowDate(getPreviousValidDate(selectedMarketFlowDate));
      } else if (e.key === "ArrowRight") {
        setSelectedMarketFlowDate(getNextValidDate(selectedMarketFlowDate));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMarketFlowDate]);

  useEffect(() => {
    const fetchTop10 = async () => {
      try {
        const res = await fetch("/data/cal/top10_sectors.json");
        const json = await res.json();
        setTop10Sectors(json);
      } catch (e) {
        console.error("❌ top10_sectors.json 로딩 실패:", e);
      }
    };
    fetchTop10();
  }, []);
  
  useEffect(() => {
    const loadSectors = async () => {
      try {
        const res = await fetch("/data/cal/monthlySector.json");
        const json = await res.json();
        setMonthlySector(json);
      } catch (e) {
        console.error("📛 monthlySector.json 로딩 실패:", e);
      }
    };
    loadSectors();
  }, []);

  useEffect(() => {
  const loadJson = async () => {
    const fileName =
      calendarView === "schedule"
        ? "/data/cal/schedule.json"
        : "/data/cal/record.json";
    try {
      const res = await fetch(fileName);
      const json = await res.json();
      setNotes(json);
    } catch (e) {
      console.error("JSON 로딩 실패:", e);
      setNotes({});
    }
  };
  loadJson();
}, [calendarView]);

{/*useEffect(() => {
  setSelectedTag(
    calendarView === "schedule"
      ? TAGS.schedule[0].label
      : TAGS.record[0].label
  );
}, [calendarView]);*/}

useEffect(() => {
  const today = new Date().toISOString().slice(0, 10); // ex: 2025-07-15

  const logVisit = async () => {
    const ref = doc(db, "visits", today);
    try {
      await updateDoc(ref, { count: increment(1) });
    } catch (e) {
      // 문서 없으면 새로 생성
      await setDoc(ref, { count: 1 });
    }

    const snap = await getDoc(ref);
    if (snap.exists()) {
      setTodayVisitCount(snap.data().count);
    }
  };

  logVisit();
}, []);


  const handleDownload = () => {
  const blob = new Blob([JSON.stringify(notes, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const fileName = calendarView === "schedule" ? "schedule.json" : "record.json";

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

  {/*const handleNoteChange = (e) => {
    setNewNote(e.target.value);
  };*/}

  {/*const handleAddNote = () => {
    const key = selectedDate.toDateString();
    const note = { text: newNote, tag: selectedTag };
    setNotes({ ...notes, [key]: [...(notes[key] || []), note] });
    setTags({ ...tags, [key]: [...(tags[key] || []), selectedTag] });
    setNewNote("");
  };*/}

  const handleDeleteNote = (dayKey: string, index: number) => {
    const updated = [...notes[dayKey]];
    updated.splice(index, 1);
    setNotes({ ...notes, [dayKey]: updated });
  };

  const handleEditNote = (dayKey: string, index: number, newText: string) => {
    const updated = [...notes[dayKey]];
    updated[index] = { 
      ...updated[index],
      text: newText
    };
    setNotes({ ...notes, [dayKey]: updated });
  };


  const renderCalendar = () => {
    console.log("📅 현재 notes 키들:", Object.keys(notes));
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let day = 1 - firstDay;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        const date = new Date(year, month, day);
        const isCurrentMonth = date.getMonth() === month;
        const isSunday = date.getDay() === 0;
        const isSaturday = date.getDay() === 6;
        const key = date.toDateString();
        const isoKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const isHoliday = isCurrentMonth && HOLIDAYS[isoKey];
        const compareDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const isSameOrAfterJune30 = compareDateOnly(date) >= new Date(2025, 5, 30); // 5는 6월
        const isTodayOrBefore = compareDateOnly(date) <= compareDateOnly(new Date());
        
        const sectorColor =
          selectedSector &&
          monthlySector[isoKey]?.includes(selectedSector) &&
          sectorStyles[selectedSector]?.color;

        const backgroundStyle = sectorColor
          ? { backgroundColor: `${sectorStyles[selectedSector].color}4D` }
          : {};

        <div
          key={key}
          className="relative h-72 border ..."
          onClick={() => setSelectedDate(date)}
        >   </div>

        week.push(
          <div
            key={key}
            style={backgroundStyle}
            className={`relative h-52 border p-1 text-sm align-top cursor-pointer group transition-all duration-200 overflow-y-auto ${
            isCurrentMonth ? "bg-white" : "bg-gray-100 text-gray-400"
          }`}
          onClick={() => setSelectedDate(date)}
          >
            <div
              className={`absolute left-1 top-1 text-xs font-semibold w-6 h-6 flex items-center justify-center transition-all duration-200
                ${
                  isSunday || isHoliday
                    ? "text-red-500 group-hover:bg-red-500"
                    : isSaturday
                    ? "text-sky-500 group-hover:bg-sky-500"
                    : "text-black group-hover:bg-black"
                }
                group-hover:rounded-full group-hover:text-white`}
                onClick={(e) => {
              e.stopPropagation();  // 이벤트 버블링 방지 — 숫자 클릭시 셀 클릭 이벤트는 무시
              setModalDate(date);
              setSelectedDate(date);
            }}
            >
              {date.getDate()}
            </div>
             {isSameOrAfterJune30 &&
                isTodayOrBefore &&
                isCurrentMonth &&
                date.getDay() !== 0 &&
                date.getDay() !== 6 &&
                !HOLIDAYS[isoKey] && (
                  <button
                    className="absolute top-1 right-1 w-5 h-5 text-[10px] rounded-full border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-150 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarketFlowDate(date);
                    }}
                    title="시장의 흐름 보기"
                  >
                    시
                  </button>
              )}
            
            {isHoliday && (
              <div className="text-xs text-red-500 mt-6">{HOLIDAYS[isoKey]}</div>
            )}

            <div className="mt-10 text-xs text-left">
              {(notes[key] || []).map((note, idx) => {
                const tagInfo = TAGS[calendarView].find(t => t.label === note.tag);
                const isEvent = note.tag === "이벤트";
                const isOther = note.tag === "기타";
                const isSpecialWarning = ["단기과열", "투자주의", "투자경고", "투자위험", "거래정지"].includes(note.tag);
                const hasPrefix = tagInfo && hasPrefixField(tagInfo);

                const labelBadge = hasPrefix ? (
                  <span
                    className="inline-block mr-1 px-[4px] py-[1px] text-[11px] rounded-none"
                    style={{
                      backgroundColor: tagInfo?.bgColor,
                      color: tagInfo?.textColor,
                      fontWeight: "bold",
                    }}
                  >
                    {tagInfo?.prefix}
                  </span>
                ) : null;

                const shouldShowBackground = tagInfo?.color && !hasPrefix;

                return (
                  <div
                    key={idx}
                    className={`relative p-1 rounded group text-left break-words
                      ${shouldShowBackground ? tagInfo.color : ""}
                      ${isEvent ? "text-white" : "text-black"}
                      ${!hasPrefix && !isOther ? "font-bold" : ""}
                      ${isSpecialWarning ? "-mt-[3px]" : "mt-[6px]"}
                    `}
                    draggable
                    onDragStart={() => handleDragStart(key, idx)}
                    onDragOver={(e) => handleDragOver(e)}
                    onDrop={() => handleDrop(key, idx)}
                    onMouseEnter={() => setHoveredNote(`${key}-${idx}`)}
                    onMouseLeave={() => setHoveredNote(null)}
                  >
                    {labelBadge}
                    {note.text}
                    {/*{hoveredNote === `${key}-${idx}` && (
                      <div className="absolute right-1 top-1 flex gap-1">
                        <button
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            const edited = prompt("수정할 내용을 입력하세요", note.text);
                            if (edited !== null) handleEditNote(key, idx, edited);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="text-xs text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(key, idx);
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    )}*/}
                  </div>
                );
              })}
            </div>
          </div>
        );
        day++;
      }
      weeks.push(
        <div key={i} className="grid grid-cols-7 gap-px">
          {week}
        </div>
      );
    }

    return weeks;
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const handleDragStart = (dayKey: string, index: number) => {
    console.log("dragStart:", dayKey, index);
    setDragSource({ key: dayKey, index });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // drop 허용
  };

  const handleDrop = (dayKey: string, targetIndex: number) => {
    if (!dragSource) return;

    const sourceKey = dragSource.key;
    const sourceIndex = dragSource.index;

    if (sourceKey !== dayKey) return;
    if (sourceIndex === targetIndex) return;

    // ✅ 존재 확인
    if (!notes[dayKey]) {
      console.warn("🚨 dayKey가 존재하지 않음:", dayKey);
      return;
    }

    const originalDayNotes = notes[dayKey];
    const newDayNotes = [...originalDayNotes];
    const [movedItem] = newDayNotes.splice(sourceIndex, 1);
    newDayNotes.splice(targetIndex, 0, movedItem);

    // ✅ 디버깅 로그
    console.log("📦 드래그 source", dragSource);
    console.log("🎯 드롭 target:", dayKey, targetIndex);
    console.log("✅ 재배치 후 notes:", newDayNotes);

    // ✅ 업데이트
    setNotes((prevNotes) => ({
      ...prevNotes,
      [dayKey]: newDayNotes,
    }));

    setDragSource(null);
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4 relative">
      {modalDate && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">
              {modalDate.toDateString()} 일정 보기
            </h2>
            <div className="text-sm space-y-1">
              {(notes[modalDate.toDateString()] || []).map((note, i) => {
                const tagInfo = TAGS[calendarView].find((t) => t.label === note.tag);
                return (
                  <div
                    key={i}
                    className={`p-1 rounded ${tagInfo?.color || ""}`}
                  >
                    {note.text}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-right">
              <Button onClick={() => setModalDate(null)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            {/* ⬅️ 왼쪽: 태그들 */}
            <div className="text-sm space-x-2 flex flex-wrap">
              {TAGS[calendarView].map((tag) => {
                const isSpecialTag =
                  "textColor" in tag && "bgColor" in tag && !!tag.textColor && !!tag.bgColor;
                const isWhiteText = tag.label === "이벤트";
                const isOther = tag.label === "기타";

                if (isSpecialTag) {
                  return (
                    <span key={tag.label} className="inline-flex items-center text-xs mr-2 mb-1">
                      <span
                        className="inline-block mr-1 px-[4px] py-[1px] text-[11px] rounded-none"
                        style={{
                          backgroundColor: tag.bgColor,
                          color: tag.textColor,
                          fontWeight: "bold"
                        }}
                      >
                        {tag.prefix}
                      </span>
                      <span className="text-black">{tag.label}</span>
                    </span>
                  );
                } else {
                  return (
                    <span
                      key={tag.label}
                      className={`inline-block px-2 py-1 rounded text-xs mr-2 mb-1 ${tag.color} ${
                        isWhiteText ? "text-white" : "text-black"
                      } ${isOther ? "" : "font-bold"}`}
                    >
                      {tag.label}
                    </span>
                  );
                }
              })}
            </div>

            {/* ➡️ 오른쪽: 섹터 드롭다운 + 일정/기록 버튼 */}
            <div className="flex items-center space-x-2">
              <select
                className="border rounded px-2 py-1 text-sm w-36"
                value=""
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="">🔥 5거래일 상위 섹터</option>
                {top10Sectors.map((item, index) => (
                  <option key={item.섹터} value={item.섹터}>
                    {index + 1}위. {item.이모지} {item.섹터}
                  </option>
                ))}
              </select>


              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="">📂 섹터 선택</option>
                {Object.entries(sectorStyles).map(([sector, style]) => (
                  <option key={sector} value={sector}>
                    {style.emoji || ""} {sector}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => setCalendarView("schedule")}
                variant="ghost"
                className={
                  calendarView === "schedule"
                    ? "bg-pink-400 text-white"
                    : "bg-white !text-black border"
                }
                size="sm"
              >
                일정
              </Button>
              <Button
                onClick={() => setCalendarView("record")}
                variant="ghost"
                className={
                  calendarView === "record"
                    ? "bg-sky-400 text-white"
                    : "bg-white !text-black border"
                }
                size="sm"
              >
                기록
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <Button variant="ghost" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="font-bold text-2xl">
              <span className="text-base mr-2">
                {currentMonth.getFullYear()}
              </span>
              {currentMonth.toLocaleString("en-US", { month: "long" }).toUpperCase()}
            </div>
            <Button variant="ghost" onClick={() => changeMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center font-medium text-sm mb-2">
            {"일월화수목금토".split("").map((d, i) => (
              <div
                key={d}
                className={
                  i === 0 ? "text-red-500" : i === 6 ? "text-sky-500" : ""
                }
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-rows-6 gap-px bg-gray-200 text-center max-h-[3500px] overflow-y-auto">
            {renderCalendar()}
          </div>

          {/*<div className="mt-6">
            <h2 className="font-semibold mb-2">
              ✏️ {selectedDate.toDateString()} {calendarView === "schedule" ? "일정" : "기록"} 입력
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                {TAGS[calendarView].map((tag) => (
                  <option key={tag.label} value={tag.label}>
                    {tag.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="flex-1 border rounded px-2 py-1 text-sm"
                value={newNote}
                onChange={handleNoteChange}
                placeholder="내용을 입력하세요"
              />
              <Button onClick={handleAddNote} size="sm">
                + 추가
              </Button>
            </div>
          </div>*/}
          {/*<div className="flex justify-end mt-6">
            <Button
              onClick={handleDownload}
              className="bg-red-500 text-white hover:bg-red-600"
              size="sm"
            >
              저장하기
            </Button>
          </div>*/}
          {selectedMarketFlowDate && (
            <div
              className="fixed inset-0 z-50 bg-black/20 flex justify-center items-center"
              onClick={() => setSelectedMarketFlowDate(null)} // 바깥 클릭 시 닫기
            >
              <div
                className="bg-white p-4 rounded shadow-lg max-w-6xl w-full h-[90vh] relative overflow-hidden"
                onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫히지 않도록 막기
              >
                {/* ❌ 닫기 버튼 */}
                <button
                  onClick={() => setSelectedMarketFlowDate(null)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-black text-xl z-10"
                >
                  ×
                </button>

                
                {/* 이전 날짜 버튼 */}
                <button
                  onClick={() => setSelectedMarketFlowDate(getPreviousValidDate(selectedMarketFlowDate))}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white border p-2 rounded-xl shadow hover:bg-gray-100 z-10"
                  title="이전 날짜"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>

                {/* 다음 날짜 버튼 */}
                <button
                  onClick={() => setSelectedMarketFlowDate(getNextValidDate(selectedMarketFlowDate))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white border p-2 rounded-xl shadow hover:bg-gray-100 z-10"
                  title="다음 날짜"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>

                {/* 🧭 차트 컴포넌트 */}
                <MarketFlowChart date={selectedMarketFlowDate} />
              </div>
            </div>
          )}
          <div className="mt-4 text-sm text-end text-gray-600">
            👁️ : {todayVisitCount}
          </div>


        </CardContent>
      </Card>
    </div>
  );
}