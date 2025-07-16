"use client";

import React, { useState, useEffect } from "react";

function formatDateYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export default function MarketFlowChart({ date }) {
  const [kospiData, setKospiData] = useState(null);
  const [kosdaqData, setKosdaqData] = useState(null);
  const [volumeData, setVolumeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    const yyyymmdd = formatDateYYYYMMDD(date);

    setLoading(true);
    Promise.all([
      fetch(`/data/backup_marketflow/${yyyymmdd}_kospi.json`).then(res => res.json()).catch(() => null),
      fetch(`/data/backup_marketflow/${yyyymmdd}_kosdaq.json`).then(res => res.json()).catch(() => null),
      fetch(`/data/backup_marketflow/volume_${yyyymmdd}.json`).then(res => res.json()).catch(() => null),
    ]).then(([kospi, kosdaq, volume]) => {
      setKospiData(kospi);
      setKosdaqData(kosdaq);
      setVolumeData(volume);
      setLoading(false);
    });
  }, [date]);

  if (loading) return <div>데이터 불러오는 중...</div>;
  if (!kospiData && !kosdaqData) return <div>데이터가 없습니다.</div>;

  return (
    <div style={{ maxWidth: "90vw", maxHeight: "80vh", overflow: "auto", background: "#fff", padding: 20, borderRadius: 8 }}>
      <h3>{date.toDateString()} 시장 흐름 차트</h3>
      <p>KOSPI 종목 수: {kospiData ? kospiData.length : 0}</p>
      <p>KOSDAQ 종목 수: {kosdaqData ? kosdaqData.length : 0}</p>
      <p>거래대금 데이터 포인트 수: {volumeData ? Object.keys(volumeData).length : 0}</p>
      {/* 여기다 기존 차트 그리는 코드를 넣으면 됩니다 */}
    </div>
  );
}