// 백테스트 실행 디버깅을 위한 테스트 스크립트
console.log("🔍 백테스트 디버깅을 시작합니다...");

// 고속도로 매매법 조건들
const conditions = [
  { name: "0-5% 하락", min: 0, max: 5, direction: "down" },
  { name: "5-10% 하락", min: 5, max: 10, direction: "down" },
  { name: "10-20% 하락", min: 10, max: 20, direction: "down" },
  { name: "0-5% 상승", min: 0, max: 5, direction: "up" },
  { name: "5-10% 상승", min: 5, max: 10, direction: "up" },
  { name: "10-20% 상승", min: 10, max: 20, direction: "up" }
];

// 샘플 주가 변화율들
const testChanges = [-15, -8, -3, -1, 0, 1, 3, 8, 15];

console.log("\n📊 조건별 테스트:");
conditions.forEach(condition => {
  console.log(`\n🎯 ${condition.name}`);
  
  testChanges.forEach(change => {
    let adjustedValue = change;
    if (condition.direction === "down") {
      adjustedValue = Math.abs(change); // 하락 시 절댓값
    }
    
    const matches = adjustedValue >= condition.min && adjustedValue < condition.max;
    
    if (matches) {
      console.log(`  ✅ ${change}% 변화 → 조건 만족 (조정값: ${adjustedValue}%)`);
    } else if (Math.abs(change) >= condition.min && Math.abs(change) < condition.max) {
      console.log(`  ⚠️  ${change}% 변화 → 절댓값으로는 만족하지만 방향성 문제`);
    }
  });
});

console.log("\n🔍 실제 삼성전자 주가에서 이런 변화가 있는지 확인이 필요합니다!");
