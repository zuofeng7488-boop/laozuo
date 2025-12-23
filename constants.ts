export const CINEMATIC_STYLES = [
  "原片 (无特殊风格)",
  "王家卫风格 (抽帧/高饱和/暧昧/广角)",
  "黑色电影 (黑白/高对比度)",
  "赛博朋克 (霓虹/暗黑未来)",
  "韦斯·安德森风格 (对称/粉彩/平面)",
  "复古70年代 (暖色/胶片颗粒/柯达Portra)",
  "极简科幻 (冷调/蓝色/金属感)",
  "恐怖惊悚 (阴暗/绿调/阴影)",
  "新海诚风格 (动漫/唯美光影)",
  "油画风格 (概念艺术)",
  "水彩风格 (柔和/艺术感)"
];

export const LIGHTING_OPTIONS = [
  "自然光 (Natural Light - 均衡)",
  "柔光 (Soft Light - 唯美/低对比)",
  "硬光 (Hard Light - 强戏剧性/高对比)",
  "伦勃朗光 (Rembrandt - 经典肖像)",
  "轮廓光/逆光 (Rim Light - 边缘勾勒)",
  "体积光 (Volumetric/God Rays - 史诗感)",
  "赛博朋克霓虹 (Cyberpunk Neon - 多色)",
  "黄金时刻 (Golden Hour - 暖调)",
  "蓝调时刻 (Blue Hour - 冷调)",
  "顶光 (Top Light - 压抑/神圣)",
  "底光 (Under Light - 恐怖/诡异)",
  "单点光源 (Spotlight - 聚焦)",
  "参考环境光 (Match Environment Ref - 需上传环境图)"
];

export const FOCAL_LENGTHS = [
  "14mm (超广角 - 夸张透视)",
  "24mm (广角 - 交代环境)",
  "35mm (人文眼 - 叙事感)",
  "50mm (标准头 - 真实自然)",
  "85mm (人像王 - 背景虚化)",
  "135mm (长焦 - 压缩空间)",
  "200mm (超长焦 - 特写特质)"
];

export const APERTURE_OPTIONS = [
  "f/1.2 (极浅景深 - 梦幻虚化)",
  "f/1.8 (浅景深 - 突出主体)",
  "f/2.8 (标准大光圈 - 通用虚化)",
  "f/4.0 (中等光圈 - 略微虚化)",
  "f/5.6 (最佳画质 - 清晰)",
  "f/8.0 (深景深 - 全局清晰)",
  "f/11 (小光圈 - 锐利)",
  "f/16 (极深景深 - 风景/日光)",
  "f/22 (星芒效果 - 极度清晰)"
];

export const CAMERA_ANGLES = [
  "平视 (Eye Level)",
  "仰拍 (Low Angle - 英雄感)",
  "俯拍 (High Angle - 渺小感)",
  "上帝视角 (Bird's Eye View)",
  "荷兰角 (Dutch Angle - 倾斜/不安)",
  "过肩镜头 (Over the Shoulder)",
  "主观视角 (POV)"
];

export const CAMERA_POSITIONS = [
  "正面 (Front View)",
  "45度侧面 (3/4 View)",
  "左侧面 (Left Profile)",
  "右侧面 (Right Profile)",
  "背面 (Back View)"
];

export const SHOT_SIZES = [
  "大远景 (Extreme Wide Shot - 交代环境)",
  "全景 (Wide Shot - 全身)",
  "中景 (Medium Shot - 腰部以上)",
  "特写 (Close-up - 面部)",
  "大特写 (Extreme Close-up - 细节)",
  "微距 (Macro)"
];

export const ASPECT_RATIOS = [
  { label: "16:9 (宽银幕)", value: "16:9" },
  { label: "4:3 (标准电视)", value: "4:3" },
  { label: "1:1 (正方形)", value: "1:1" },
  { label: "3:4 (纵向构图)", value: "3:4" },
  { label: "9:16 (手机竖屏)", value: "9:16" }
];

export const INITIAL_FRAMES = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  imageUrl: null,
  prompt: "",
  isLoading: false,
  settings: {
    style: CINEMATIC_STYLES[0],
    angle: CAMERA_ANGLES[0],
    cameraPosition: CAMERA_POSITIONS[0],
    focalLength: FOCAL_LENGTHS[3], // Default 50mm
    aperture: APERTURE_OPTIONS[2], // Default f/2.8
    shotSize: SHOT_SIZES[1],
    lighting: LIGHTING_OPTIONS[0],
    aspectRatio: "16:9"
  }
}));