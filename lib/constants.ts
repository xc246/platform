export const ITEM_CATEGORIES = [
  { value: 'study', label: '学习用品类' },
  { value: 'electronic', label: '电子设备类' },
  { value: 'daily', label: '生活用品类' },
  { value: 'id_card', label: '证件与卡片类' },
  { value: 'valuables', label: '个人饰品与贵重物品' },
  { value: 'others', label: '其他' },
] as const

export const COMMON_LOCATIONS = [
  '教室',
  '图书馆',
  '实验室',
  '宿舍',
  '食堂',
  '操场',
  '其他',
  '不是很清楚',
] as const

export const ITEM_CATEGORIES_MAP = {
  study: '学习用品类',
  electronic: '电子设备类',
  daily: '生活用品类',
  id_card: '证件与卡片类',
  valuables: '个人饰品与贵重物品',
  others: '其他',
} as const

export const POST_STATUS = {
  open: '寻找中',
  closed: '已找回',
} as const
