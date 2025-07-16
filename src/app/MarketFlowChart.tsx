"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { sectorStyles, getTextColor } from "@/constants/sectorStyles";

interface VolumeRating {
  [key: string]: number;
}

interface VolumeData {
  [time: string]: string;
  rating?: VolumeRating;
}


function hexToRgba(hex: string = "#cccccc", alpha: number = 1) {
  const clean = (hex || "").trim().replace(/^#/, "");

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `rgba(204,204,204,${alpha})`; // fallback: #cccccc
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

function getTextColorFromHex(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 150 ? "#ffffff" : "#000000";
}

const getX = (rate: number) => {
  if (rate < 0) {
    return ((rate + 30) / 30) * 20;
  } else {
    return 20 + (rate / 30) * 80;
  }
};

const getY = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  const minutes = h * 60 + m;
  if (minutes < 480) return 0;
  if (minutes <= 900) return ((minutes - 480) / (900 - 480)) * 75;
  return 75 + ((minutes - 900) / 60) * 4;
};

const getYRatio = (timeStr: string): number => {
  let y = getY(timeStr);

  const adjustMap: Record<string, number> = {
    "08:00": 2,
    "08:20": 1.5,
    "08:40": 1,
  };
  y += adjustMap[timeStr] ?? 0;
  return y;
};

const StarRating = ({ value }: { value: number }) => {
  const stars = [];
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  for (let i = 0; i < 5; i++) {
    const filled = numValue >= i + 1;
    const half = !filled && numValue >= i + 0.5;
    const key = `star-${i}`;

    stars.push(
      <img
        key={key}
        src={
          filled
            ? "/icons/star-filled.png"
            : half
            ? "/icons/star-halffilled.png"
            : "/icons/star-empty.png"
        }
        alt="별"
        style={{ width: 20, height: 20, marginRight: 2 }}
      />
    );
  }
  return <div className="flex">{stars}</div>;
};



const MarketFlowChart = ({ date }: MarketFlowChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const dragItemRef = useRef<any>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const getFontSize = (크기: number): number => {
    return 크기 >= 250 ? 36
         : 크기 >= 200 ? 28
         : 크기 >= 150 ? 16
         : 크기 >= 100 ? 12
         : 10;
  };
  const [dimensions, setDimensions] = useState({ width: 600, height: 1500 });

  const [marketType, setMarketType] = useState("전체");
  const [kospiData, setKospiData] = useState<any[]>([]);
  const [kosdaqData, setKosdaqData] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [timeSectorMap, setTimeSectorMap] = useState<Record<string, string[]>>({});
  const [volumeData, setVolumeData] = useState<VolumeData>({});
  const [hoveredItem, setHoveredItem] = useState<any | null>(null);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = 1500;

        setDimensions({ width, height });

        // 🔧 반드시 실제 캔버스의 속성도 설정!
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = 1500;

      }
    };

    window.addEventListener("resize", updateSize);
    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ✅ 드래그로 이동시키는 마우스 이벤트 핸들러 — 이 위치에 추가!
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ✅ 1. 마우스 드래그 관련 변수
    let isDragging = false;
    let dragItem: any = null;
    let offsetX = 0;
    let offsetY = 0;

    // ✅ 2. 마우스 다운
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (let item of data) {
        const x = (item.xRatio / 100) * canvas.width;
        const y = (item.yRatio / 100) * canvas.height;
        const fontSize = getFontSize(item.크기);
        ctx.font = `${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(item.종목명).width;
        const padding = 4;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = fontSize + padding * 2;

        const boxLeft = x - boxWidth / 2;
        const boxTop = y - boxHeight / 2;

        if (
          mouseX >= boxLeft &&
          mouseX <= boxLeft + boxWidth &&
          mouseY >= boxTop &&
          mouseY <= boxTop + boxHeight
        ) {
          isDraggingRef.current = true;
          dragItemRef.current = item;
          offsetRef.current = { x: mouseX - x, y: mouseY - y };
          break;
        }
      }
    };

    // ✅ 3. 마우스 무브
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingRef.current && dragItemRef.current) {
        const newX = mouseX - offsetRef.current.x;
        const newY = mouseY - offsetRef.current.y;
        const newXRatio = (newX / rect.width) * 100;
        const newYRatio = (newY / rect.height) * 100;

        const updated = data.map((item) =>
          item.id === dragItemRef.current?.id
            ? { ...item, xRatio: newXRatio, yRatio: newYRatio }
            : item
        );
        setData(updated);
      }
      
      // ✅ 4. hover 감지
      let hovered: any = null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      for (let item of data) {
        const x = (item.xRatio / 100) * canvas.width;
        const y = (item.yRatio / 100) * canvas.height;
        const fontSize = getFontSize(item.크기);
        ctx.font = `${fontSize}px sans-serif`;
        const padding = 4;
        const textWidth = ctx.measureText(item.종목명).width;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = fontSize + padding * 2;

        const boxLeft = x - boxWidth / 2;
        const boxTop = y - boxHeight / 2;

        if (
        mouseX >= boxLeft &&
        mouseX <= boxLeft + boxWidth &&
        mouseY >= boxTop &&
        mouseY <= boxTop + boxHeight
      ) {
        hovered = item; // 무조건 hover로 잡되, 렌더링할 때 조건 걸자!
        break;
      }
      }

      setHoveredItem(hovered);
    };

    // ✅ 5. 마우스 업
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      dragItemRef.current = null;
    };

    // ✅ 6. 이벤트 등록
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", () => setHoveredItem(null));

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", () => setHoveredItem(null));
    };
  }, [data]);


  useEffect(() => {
    if (containerRef.current && canvasRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const height = 1500;
      setDimensions({ width: containerWidth, height });

      // 여기서 실제 canvas의 width, height 속성도 직접 설정해줘야 함!
      const canvas = canvasRef.current;
      canvas.width = containerWidth;
      canvas.height = height;
    }
  }, []);
  // 🔄 날짜에 맞는 JSON 불러오기
  useEffect(() => {
    const loadData = async () => {
      try {
        const kospiRes = await fetch(`/data/backup_marketflow/${yyyymmdd}_kospi.json`);
        const kosdaqRes = await fetch(`/data/backup_marketflow/${yyyymmdd}_kosdaq.json`);
        const volumeRes = await fetch(`/data/backup_marketflow/volume_${yyyymmdd}.json`);

        const kospi = kospiRes.ok ? await kospiRes.json() : [];
        const kosdaq = kosdaqRes.ok ? await kosdaqRes.json() : [];
        const volume = volumeRes.ok ? await volumeRes.json() : {};

        console.log("📦 volumeData 전체:", volume);
        console.log("⭐ rating:", volume.rating);

        setKospiData(kospi);
        setKosdaqData(kosdaq);
        setVolumeData(volume);
      } catch (e) {
        console.warn("데이터 로딩 실패:", e);
      }
    };
    loadData();
  }, [yyyymmdd]);

  // 선택된 시장 기준 데이터 결합
  useEffect(() => {
    const generateId = (item: any, index: number) =>
      `${item.종목명}-${item.고가발생시간 || index}`; // 시간까지 합쳐서 유니크하게

    if (marketType === "전체") {
      const combined = [...kospiData, ...kosdaqData].map((item, index) => ({
        ...item,
        id: generateId(item, index),
        xRatio: getX(item.고가등락률),
        yRatio: getYRatio(item.고가발생시간 || "00:00"),
      }));
      setData(combined);
    } else if (marketType === "코스피") {
      setData(
        kospiData.map((item, index) => ({
          ...item,
          id: generateId(item, index),
          xRatio: getX(item.고가등락률),
          yRatio: getYRatio(item.고가발생시간 || "00:00"), // 꼭 필요!
        }))
      );
    } else {
      setData(
        kosdaqData.map((item, index) => ({
          ...item,
          id: generateId(item, index),
          xRatio: getX(item.고가등락률),
          yRatio: getYRatio(item.고가발생시간 || "00:00"),
        }))
      );
    }
  }, [marketType, kospiData, kosdaqData]);

  // 시간대별 주도 섹터 분석
  useEffect(() => {
    const sectorMap: Record<string, Record<string, number>> = {};
    data.forEach((item) => {
      const [h, m] = item.고가발생시간?.split(":").map(Number) || [0, 0];
      const hour = m >= 30 ? h + 1 : h;
      const timeKey = `${hour.toString().padStart(2, "0")}:00`;
      if (!sectorMap[timeKey]) sectorMap[timeKey] = {};
      const sector = item.섹터 || "없음";
      sectorMap[timeKey][sector] = (sectorMap[timeKey][sector] || 0) + 1;
    });

    const result: Record<string, string[]> = {};
    for (const [time, sectors] of Object.entries(sectorMap)) {
      const filtered = Object.entries(sectors)
        .filter(([sector, count]) => count >= 2 && sector !== "섹터")
        .sort((a, b) => b[1] - a[1])
        .map(([s]) => s);
      if (filtered.length) result[time] = filtered;
    }
    
    setTimeSectorMap(result);
  }, [data]);

  // 캔버스 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;

    // ✅ 1. X축 기준선
    const xLabels = [-30, 0, 10, 20, 30];
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#115bcb");
    gradient.addColorStop(0.2, "#ffffff");
    gradient.addColorStop(1, "#e71909");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 10);
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    xLabels.forEach((tick) => {
      const x = (getX(tick) / 100) * width;
      ctx.fillStyle = "#000";
      ctx.fillText(`${tick}%`, x, 14);
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, height);
      ctx.strokeStyle = "#ddd";
      ctx.stroke();
    });

    // ✅ 2. Y축 기준선
    const yTicks = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    yTicks.forEach((hour) => {
      const y = (getY(`${hour.toString().padStart(2, "0")}:00`) / 100) * height;
      ctx.fillStyle = "#000";
      ctx.fillText(`${hour}시`, 45, y);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width, y);
      ctx.strokeStyle = "#ddd";
      ctx.stroke();
    });

    // ✅ 3. 거래대금
    ctx.textAlign = "left";
    ctx.font = "11px sans-serif";
    const volumeTimes = ["09:30", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "15:30"];
    volumeTimes.forEach((timeStr) => {
      const y = (getY(timeStr) / 100) * height;
      const text = volumeData[timeStr];
      if (text) {
        text.split("\n").forEach((line, i) => {
          ctx.fillStyle = "#000";
          ctx.fillText(line, width - 60, y + (i - 0.5) * 12);
        });
      }
    });

    // ✅ 4. 주도 섹터 박스
    yTicks.forEach((hour) => {
      const timeStr = `${hour.toString().padStart(2, "0")}:00`;
      const y = (getY(timeStr) / 100) * height + 14;
      const sectors = timeSectorMap[timeStr] || [];

      sectors.forEach((sector, idx) => {
        const style = sectorStyles[sector] || { emoji: "❓", color: "#ccc" };
        const label = `${style.emoji} ${sector}`;

        const offsetY = y + idx * 20; // ✅ 여기 선언 필요

        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const textWidth = ctx.measureText(label).width;
        // ctx.fillStyle = style.color;
        // ctx.fillRect(55, offsetY - 8, textWidth + 8, 16);

        // ctx.fillStyle = getTextColorFromHex(style.color);
        // ctx.fillText(label, 59, offsetY);
      });
    });

    // ✅ 5. 종목명 박스 (맨 마지막에 그려야 위에 뜸)
    data.forEach((item) => {
      const x = (item.xRatio / 100) * width;
      const y = (item.yRatio / 100) * height;

      const style = sectorStyles[item.섹터] || { color: "#ccc" };
      const hexColor = style.color;
      const textColor = "#000000";
      const label = item.종목명;

      const fontSize =
        item.크기 >= 250 ? 36 :
        item.크기 >= 200 ? 28 :
        item.크기 >= 150 ? 16 :
        item.크기 >= 100 ? 12 :
        10;

      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const textWidth = ctx.measureText(label).width;
      const padding = 4;
      const boxHeight = fontSize + padding * 2;

      const isHovered =
        hoveredItem?.종목명 === item.종목명 ||
        (hoveredSector && hoveredSector === item.섹터);

      const alpha = isHovered ? 1.0 : 0.3;

      ctx.fillStyle = hexToRgba(hexColor, alpha);
      ctx.fillRect(
        x - textWidth / 2 - padding,
        y - boxHeight / 2,
        textWidth + padding * 2,
        boxHeight
      );

      ctx.fillStyle = textColor;
      ctx.fillText(label, x, y);
    });
  }, [data, dimensions, timeSectorMap, volumeData, hoveredItem, hoveredSector]);


  return (
    <Card className="p-4 space-y-4">
      <div className="relative">
        {/* 왼쪽 상단 문구 */}
        <div className="absolute left-0 top-1 text-gray-500 text-sm" style={{ fontSize: "12px", whiteSpace: "pre-line" }}>
          드래그를 통해 종목을 이동하실 수 있습니다.
          {"\n"}마우스를 올려 섹터와 뉴스를 확인하실 수 있습니다.
        </div>

        {/* 중앙 제목 */}
        <div className="text-center">
          <div className="text-sm text-gray-500">{date.getFullYear()}</div>
          <div className="text-2xl font-bold">
            {date.getMonth() + 1}월 {date.getDate()}일 시장의 흐름
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-start mb-4">
        {["전체", "코스피", "코스닥"].map((type) => (
          <button
            key={type}
            onClick={() => setMarketType(type)}
            className={`px-4 py-1 rounded border text-sm font-bold ${
              marketType === type ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

    <div
      ref={containerRef}
      className="w-full relative overflow-auto"
      style={{ maxHeight: "800px", maxWidth: "100%" }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={1500}
        className="border rounded mx-auto block cursor-move"
      />

      {Object.entries(timeSectorMap).map(([timeStr, sectors]) => {
        const y = (getY(timeStr) / 100) * dimensions.height + 14;

        return sectors.map((sector, idx) => {
          const style = sectorStyles[sector] || { emoji: "❓", color: "#ccc" };
          const label = `${style.emoji} ${sector}`;

          const offsetY = y + 17 * idx;

          const textColor = getTextColorFromHex(style.color);

          return (
            <div
              key={`${timeStr}-${sector}`}
              className="absolute text-xs font-bold rounded px-2 cursor-pointer" // padding 좌우 여유 늘림
              style={{
                top: offsetY - 8,          // 위 아래 간격 좀 더 띄우기
                left: 55,
                backgroundColor: style.color,
                color: textColor,
                zIndex: 10,
                pointerEvents: "auto",
                borderRadius: "2px",
                whiteSpace: "nowrap",       // 텍스트 줄바꿈 방지
                marginBottom: "4px",        // 아래 마진 추가 (간격 확보용, 필요시 부모 flex 등 조절 필요)
                userSelect: "none",         // 텍스트 드래그 방지
                boxSizing: "border-box",    // 패딩이 박스 크기에 포함되게
                maxWidth: "200px",          // 너무 길면 줄이기(필요시)
                overflow: "hidden",
                textOverflow: "ellipsis",   // 넘치면 ...으로 표시
              }}
              onMouseEnter={() => setHoveredSector(sector)}
              onMouseLeave={() => setHoveredSector(null)}
            >
              {label}
            </div>
          );
        });
      })}

      {/* ✅ 별점 블록: volumeData.rating이 있을 때만 표시 */}
      <div className="pt-4 space-y-2 text-sm px-4 pb-8 bg-white">
        {["미장 상태", "시장 난이도", "상한가 트렌드"].map((label) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-24 text-gray-600 font-bold">{label}</div>
            <StarRating value={volumeData.rating?.[label] || 0} />
          </div>
        ))}
        {/* ✅ COMMENT 영역 */}
          <div className="mt-4 border rounded p-3 bg-gray-50">
            <div className="text-gray-800 font-bold mb-2">COMMENT</div>
            <div className="text-gray-800 whitespace-pre-line text-sm">{volumeData.comment}</div>
          </div>
      </div>

      {/* ✅ 항상 존재하는 여유 공간 */}
      <div style={{ height: 200 }} />
    </div>

      {hoveredItem && canvasRef.current && (() => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const sector = hoveredItem.섹터;
        const note = hoveredItem.메모?.trim() || "";

        // sector가 유효하면 sector label을 sectorStyles에서 가져옴
        let tooltipText = "";

        if (sector && sector !== "섹터" && sector !== "없음") {
          const style = sectorStyles[sector] || { emoji: "", color: "#ccc" };
          tooltipText = `${style.emoji} ${sector}`;
        }

        if (note) {
          tooltipText = tooltipText ? `${tooltipText}\n${note}` : note;
        }

        if (!tooltipText) return null;

        const fontSize =
          hoveredItem.크기 >= 250 ? 36 :
          hoveredItem.크기 >= 200 ? 28 :
          hoveredItem.크기 >= 150 ? 16 :
          hoveredItem.크기 >= 100 ? 12 :
          10;

        const padding = 4;
        ctx.font = `${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(hoveredItem.종목명).width;
        const boxHeight = fontSize + padding * 2;

        const canvasX = (hoveredItem.xRatio / 100) * canvas.width;
        const canvasY = (hoveredItem.yRatio / 100) * canvas.height;

        const left = rect.left + canvasX - textWidth / 2 - padding;
        const top = rect.top + canvasY + boxHeight / 2;

        return (
          <div
            className="fixed text-sm px-2 py-1 border rounded shadow bg-yellow-50"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              transform: "translate(0%, 0%)",
              pointerEvents: "none",
              whiteSpace: "pre-line",
              zIndex: 1000,
              minWidth: "120px"
            }}
          >
            {sector && sector !== "섹터" && sector !== "없음" && (
              <div className="font-bold text-gray-800">
                {sectorStyles[sector]?.emoji || "📂"} {sector}
              </div>
            )}
            {note && <div className="text-gray-800 mt-1">{note}</div>}
          </div>
        );
      })()}
    </Card>
  );
};

export default MarketFlowChart;