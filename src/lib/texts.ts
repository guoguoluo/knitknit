export const texts = {
  // Metadata / SEO
  siteTitle: "YarnInspire - 毛线管理与灵感收集",
  siteDescription: "管理你的毛线库存，收集编织灵感",
  htmlLang: "zh-CN",
  appleWebAppTitle: "YarnInspire",

  // Nav
  brand: "🧶 YarnInspire",
  navYarns: "毛线",
  navInspirations: "灵感",

  // Homepage
  homeHeading: "你的编织宇宙",
  homeYarnColumn: "🧶 毛线",
  homeInspColumn: "💡 灵感",
  homeYarnTooltip: "毛线 · 点击查看",
  homeInspTooltip: "灵感 · 点击查看",
  homeManageYarns: "管理毛线",
  homeBrowseInspirations: "浏览灵感",

  // Yarn list page
  yarnListHeading: "我的毛线",
  yarnListAdd: "+ 添加毛线",
  yarnListSearch: "搜索名称或品牌...",
  yarnListAllTags: "全部标签",
  yarnListLoading: "加载中...",
  yarnListEmpty: "还没有毛线记录，点击上方按钮添加",
  yarnListDelete: "删除",

  // Yarn detail page
  yarnNotFound: "毛线不存在",
  yarnBack: "← 返回",
  yarnEdit: "编辑",
  yarnDelete: "删除",
  yarnRelatedInspirations: "📌 已关联的灵感",
  yarnRecommendedInspirations: "💡 匹配的灵感推荐",

  // Yarn form
  yarnFormEditTitle: "编辑毛线",
  yarnFormAddTitle: "添加毛线",
  yarnFormName: "名称 *",
  yarnFormBrand: "品牌",
  yarnFormMainColor: "主颜色",
  yarnFormMultiColor: "多种颜色（可选）",
  yarnFormAddColor: "添加色块",
  yarnFormAnalyzing: "正在从图片识别颜色...",
  yarnFormMaterial: "材质（如：羊毛、棉、亚麻）",
  yarnFormQty: "数量",
  yarnFormUnitG: "克(g)",
  yarnFormUnitM: "米(m)",
  yarnFormUnitPiece: "个",
  yarnFormUnitBall: "团",
  yarnFormTags: "标签（用逗号分隔，如：粗线, 暖色, 冬季）",
  yarnFormNotes: "备注信息",
  yarnFormPhoto: "照片（上传后自动去背景、识别颜色）",
  yarnFormProcessing: "处理中...",
  yarnFormSave: "保存",
  yarnFormAdd: "添加",
  yarnFormCancel: "取消",

  // Materials (for dropdown / inference)
  knownMaterials: ["羊毛", "棉", "亚麻", "丝", "羊绒", "马海毛", "腈纶", "尼龙", "竹纤维", "羊驼毛", "美利奴", "真丝"],
  materialMap: {
    wool: "羊毛",
    merino: "羊毛",
    cotton: "棉",
    silk: "丝",
    linen: "亚麻",
    alpaca: "羊驼毛",
    mohair: "马海毛",
    acrylic: "腈纶",
    nylon: "尼龙",
  } as Record<string, string>,

  // Inspiration list page
  inspListHeading: "灵感收集",
  inspListAdd: "+ 添加灵感",
  inspListSearch: "搜索灵感标题...",
  inspListAllPlatforms: "全部平台",
  inspListLoading: "加载中...",
  inspListEmpty: "还没有灵感，快去发现好看的毛衣吧",
  inspListHasPattern: "📋 有图解",
  inspListViewOriginal: "查看原文 ↗",
  inspListDelete: "删除",

  // Inspiration detail page
  inspNotFound: "灵感不存在",
  inspBack: "← 返回",
  inspPatternLabel: "图解：",
  inspPdfPattern: "📄 PDF图解",
  inspUrlPattern: "🔗 图解链接",
  inspViewOriginal: "查看原文 ↗",
  inspEdit: "编辑",
  inspDelete: "删除",
  inspRelatedSection: "🔄 相关灵感和推荐搜索",
  inspSearchXiaohongshu: "📕 小红书搜同款",
  inspSearchRavelry: "🧶 Ravelry搜同款",
  inspSearchInstagram: "📸 Instagram搜同款",
  inspRelatedYarn: "🧶 关联的毛线",

  // Inspiration form
  inspFormEditTitle: "编辑灵感",
  inspFormAddTitle: "添加灵感",
  inspFormTitlePlaceholder: "标题 *",
  inspFormUrlPlaceholder: "链接 URL（粘贴后自动抓取信息）",
  inspFormScraping: "抓取中...",
  inspFormPlatformDefault: "选择平台",
  inspFormPlatformXiaohongshu: "小红书",
  inspFormPlatformInstagram: "Instagram",
  inspFormPlatformRavelry: "Ravelry",
  inspFormPlatformPinterest: "Pinterest",
  inspFormPlatformOther: "其他",
  inspFormSelectYarn: "关联毛线（可选）",
  inspFormTags: "标签（逗号分隔，如：开衫, 麻花, 短款）",
  inspFormNotes: "备注",
  inspFormImageLabel: "参考图",
  inspFormAutoScraped: "✓ 已自动抓取封面",
  inspFormUploading: "上传中...",
  inspFormScrapeFail: "未能自动抓取到封面图片，可手动上传",
  inspFormScrapeError: "抓取失败，可手动填写",
  inspFormImageError: "图片加载失败，可重新抓取或手动上传",
  inspFormRescrape: "重新抓取",
  inspFormPatternLabel: "图解（PDF / 图片 / 网址）",
  inspFormPatternPlaceholder: "或输入图解链接",
  inspFormUploadFile: "上传文件",
  inspFormViewPdf: "📄 查看PDF图解",
  inspFormViewPatternUrl: "🔗 打开图解链接",
  inspFormSave: "保存",
  inspFormAdd: "添加",
  inspFormCancel: "取消",

  // Recommendation panel
  recHeading: "🔍 智能推荐",
  recDescription: "根据毛线信息自动搜索：",
  recNoKeywords: "暂无关键词",
  recFootnote: "点击后将在新标签页中打开搜索，可根据实际毛线特征调整关键词",

  // Color name mapping for recommendations
  colorNames: [
    { hex: (r: number, g: number, b: number) => r > 230 && g > 230 && b > 230, name: "白色/white" },
    { hex: (r: number, g: number, b: number) => r < 40 && g < 40 && b < 40, name: "黑色/black" },
    { hex: (r: number, g: number, b: number) => r > 200 && g < 80 && b < 80, name: "红色/red" },
    { hex: (r: number, g: number, b: number) => r > 200 && g > 100 && b < 80, name: "橙色/orange" },
    { hex: (r: number, g: number, b: number) => r > 200 && g > 180 && b < 80, name: "黄色/yellow" },
    { hex: (r: number, g: number, b: number) => r < 80 && g > 150 && b < 80, name: "绿色/green" },
    { hex: (r: number, g: number, b: number) => r < 80 && g < 100 && b > 180, name: "蓝色/blue" },
    { hex: (r: number, g: number, b: number) => r > 150 && g < 80 && b > 150, name: "紫色/purple" },
    { hex: (r: number, g: number, b: number) => r > 180 && g > 140 && b > 180, name: "粉色/pink" },
    { hex: (r: number, g: number, b: number) => r > 140 && g > 100 && b < 80, name: "棕色/brown" },
    { hex: (r: number, g: number, b: number) => r > 160 && g > 160 && b > 100, name: "米色/beige" },
    { hex: (r: number, g: number, b: number) => r < 100 && g > 100 && b > 130, name: "蓝绿色/teal" },
    { hex: (r: number, g: number, b: number) => r > 120 && g < 80 && b < 100, name: "酒红/wine" },
  ] as { hex: (r: number, g: number, b: number) => boolean; name: string }[],

  // Platform names for recommendation links
  platforms: [
    { name: "小红书", icon: "📕", searchUrl: (q: string) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q)}&type=1` },
    { name: "Instagram", icon: "📸", searchUrl: (q: string) => `https://www.instagram.com/explore/tags/${encodeURIComponent(q)}/` },
    { name: "Ravelry", icon: "🧶", searchUrl: (q: string) => `https://www.ravelry.com/patterns/search#search=${encodeURIComponent(q)}&view=captioned_grid&sort=best` },
    { name: "Pinterest", icon: "📌", searchUrl: (q: string) => `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}` },
    { name: "Etsy", icon: "🛍️", searchUrl: (q: string) => `https://www.etsy.com/search?q=${encodeURIComponent(q)}` },
  ] as { name: string; icon: string; searchUrl: (q: string) => string }[],

  // Inspiration detail platform search buttons
  detailPlatforms: [
    { label: "📕 小红书搜同款", url: (q: string) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q)}&type=1` },
    { label: "🧶 Ravelry搜同款", url: (q: string) => `https://www.ravelry.com/patterns/search#search=${encodeURIComponent(q)}&view=captioned_grid&sort=best` },
    { label: "📸 Instagram搜同款", url: (q: string) => `https://www.instagram.com/explore/tags/${encodeURIComponent(q)}/` },
  ] as { label: string; url: (q: string) => string }[],

  // Icons page
  iconPageTitle: "PWA 图标生成器",
  iconPageDesc: "点击下方按钮下载 PNG 图标，然后放入 ",
  iconPageDir: "public/icons/ 目录",
  iconDownload192: "下载 192x192",
  iconDownload512: "下载 512x512",
  iconHintTitle: "提示：",
  iconHintBody: "下载后将文件放到 public/icons/ 目录，然后更新 manifest.json",
  iconGenerating: (size: number) => `正在生成 ${size}x${size}...`,
  iconDownloaded: (size: number) => `${size}x${size} 已下载！`,

  // Export / Import
  exportData: "导出数据",
  exportSuccess: "数据已导出！",
  exportFail: "导出失败",
  importData: "导入数据",
  importPrompt: "选择之前导出的 .json 文件导入",
  importSuccess: "数据已导入！页面即将刷新...",
  importFail: "导入失败，请检查文件格式",
  importConfirm: "导入将覆盖所有现有数据，确定继续？",

  // Common
  loading: "加载中...",
} as const;

export type Texts = typeof texts;