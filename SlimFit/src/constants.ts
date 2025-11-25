
import { RouteType } from './types';

// Diet Plans
export const AGGRESSIVE_DIET = [
  { day: 1, title: "液断日 (启动代谢)", food: "全天仅饮用液体：脱脂牛奶、无糖豆浆、黑咖啡、大量白开水 (合计2000ml+)。", workout: "HIIT 高强度间歇 (40分钟) - 快速消耗糖原" },
  { day: 2, title: "低碳蛋奶 (快速燃脂)", food: "早餐：水煮蛋2个；午餐：鸡蛋羹 + 黄瓜；晚餐：蛋白粉/牛奶。", workout: "慢跑/爬坡 5公里 (心率140左右)" },
  { day: 3, title: "纯肉日 (蛋白质冲击)", food: "全天只吃肉类（牛排/鸡胸/鱼肉）+ 少量绿叶菜。杜绝任何主食和水果。", workout: "核心腹肌训练 (20分钟) + 平板支撑" },
  { day: 4, title: "高纤排毒 (清理肠道)", food: "苹果/西柚/火龙果 (低糖水果) + 粗纤维蔬菜 (芹菜/菠菜)。", workout: "跳绳 2000个 (分5组完成)" },
  { day: 5, title: "极速燃脂 (碳水循环)", food: "早餐：全麦面包1片；午餐：鸡胸肉+西兰花；晚餐：黄瓜/番茄。", workout: "全身燃脂操 / 波比跳 (30分钟)" },
  { day: 6, title: "轻断食 (细胞自噬)", food: "全天热量控制在500大卡。推荐：蔬菜汤、豆腐、魔芋丝。", workout: "瑜伽 / 普拉提 (1小时) - 舒缓拉伸" },
  { day: 7, title: "欺骗餐 (打破平台期)", food: "允许一顿想吃的美食 (火锅/烤肉)，但只吃7分饱，其余时间清淡。", workout: "彻底休息，保证睡眠" },
];

export const GENTLE_DIET = [
  { day: 1, title: "均衡启动 (适应期)", food: "早餐：燕麦牛奶+鸡蛋；午餐：杂粮饭+去皮鸡腿+青菜；晚餐：大拌菜。", workout: "快走 30分钟 (激活身体状态)" },
  { day: 2, title: "优质碳水 (供能)", food: "主食选用玉米/红薯/紫薯。搭配鱼虾类低脂蛋白。多喝水。", workout: "动感单车 / 骑行 40分钟" },
  { day: 3, title: "控糖日 (平稳血糖)", food: "拒绝精制米面糖。多吃深色蔬菜。加餐可选少量坚果 (10g)。", workout: "帕梅拉/居家哑铃操 25分钟" },
  { day: 4, title: "高蛋白日 (增肌减脂)", food: "增加蛋白质摄入 (每公斤体重1.5g)。瘦牛肉、虾仁、豆腐为主。", workout: "慢跑 40分钟 + 拉伸" },
  { day: 5, title: "维他命日 (抗氧化)", food: "彩虹饮食法：每餐至少3种颜色的蔬菜水果。少油少盐烹饪。", workout: "游泳 / 划船机 40分钟" },
  { day: 6, title: "轻盈日 (减轻负担)", food: "晚餐提前至18:00前吃完。以易消化的粥或酸奶沙拉为主。", workout: "户外徒步 / 爬山 / 逛街 1小时" },
  { day: 7, title: "休息调整 (身心放松)", food: "正常一日三餐，保持每餐七分饱。感受饥饿感再进食。", workout: "冥想 / 泡沫轴滚压放松" },
];

export const getDailyPlan = (route: RouteType | undefined, dayIndex: number) => {
  const plan = (route === 'aggressive') ? AGGRESSIVE_DIET : GENTLE_DIET;
  // Safety checks
  if (isNaN(dayIndex) || dayIndex < 0) dayIndex = 0;
  if (!plan || plan.length === 0) return { day: 0, title: "休息", food: "均衡饮食", workout: "休息" };
  
  return plan[dayIndex % 7] || plan[0];
};