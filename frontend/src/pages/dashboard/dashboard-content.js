export const NAV_ITEMS = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Hiragana', path: '/hiragana' },
  { label: 'Katakana', path: '/katakana' },
  { label: 'Bài học', path: '/lessons' },
  { label: 'Từ điển', path: '/dictionary' },
  { label: 'Flashcard', path: '/flashcards' },
  { label: 'Văn hóa', path: '/culture' },
]

export const STAT_META = [
  {
    key: 'lessonsCompleted',
    label: 'Bài học đã hoàn thành',
    icon: 'BK',
    tone: 'blue',
  },
  {
    key: 'wordsUnlocked',
    label: 'Từ vựng đã mở khóa',
    icon: 'WD',
    tone: 'green',
  },
  {
    key: 'flashcardsCreated',
    label: 'Flashcard',
    icon: 'FC',
    tone: 'violet',
  },
  {
    key: 'studyStreak',
    label: 'Ngày học liên tiếp',
    icon: 'ST',
    tone: 'orange',
  },
]

export const HERO_HIGHLIGHTS = [
  'Nền tảng Kana',
  'Bài học JLPT N5 đến N1',
  'Công cụ ôn từ vựng',
]

export const OVERVIEW_CARDS = [
  {
    title: 'Học hệ chữ viết',
    description:
      'Bắt đầu với Hiragana và Katakana, sau đó xây nền tảng vững trước khi vào bài học.',
    accent: 'pink',
  },
  {
    title: 'Đi theo lộ trình rõ ràng',
    description:
      'Học ngữ pháp, từ vựng và bài tập theo từng cấp độ có cấu trúc từ cơ bản trở lên.',
    accent: 'blue',
  },
  {
    title: 'Ôn đúng phần quan trọng',
    description:
      'Dùng từ điển và flashcard để giữ lại những từ quan trọng trong suốt quá trình học.',
    accent: 'green',
  },
]

export const FEATURE_GROUPS = [
  {
    key: 'foundation',
    title: 'Nền tảng',
    description: 'Nắm chắc hai bảng âm tiết cốt lõi của tiếng Nhật trước.',
  },
  {
    key: 'study',
    title: 'Học & ôn tập',
    description: 'Xây vốn từ, ngữ pháp và trí nhớ dài hạn.',
  },
  {
    key: 'explore',
    title: 'Khám phá thêm',
    description: 'Dùng công cụ hỗ trợ và bối cảnh văn hóa để học tự nhiên hơn.',
  },
]

export const FEATURES = [
  {
    title: 'Học Hiragana',
    description: 'Nắm chắc bảng âm tiết nền tảng của tiếng Nhật qua bảng luyện tập rõ ràng.',
    path: '/hiragana',
    icon: 'HI',
    tone: 'pink',
    category: 'foundation',
  },
  {
    title: 'Học Katakana',
    description: 'Học bảng chữ dùng cho từ ngoại lai, tên riêng và từ mượn.',
    path: '/katakana',
    icon: 'KA',
    tone: 'purple',
    category: 'foundation',
  },
  {
    title: 'Bài học',
    description: 'Học theo bài có cấu trúc theo cấp độ JLPT và theo dõi tiến độ.',
    path: '/lessons/n5',
    icon: 'LS',
    tone: 'blue',
    category: 'study',
  },
  {
    title: 'Từ điển',
    description: 'Tra cứu và ôn lại từ vựng hữu ích khi kho từ của bạn tăng lên.',
    path: '/dictionary',
    icon: 'DI',
    tone: 'green',
    category: 'study',
  },
  {
    title: 'Mẫu câu',
    description: 'Luyện các cách nói hằng ngày cho du lịch, lớp học và hội thoại.',
    path: '/phrases',
    icon: 'PH',
    tone: 'orange',
    category: 'explore',
  },
  {
    title: 'Tạo flashcard',
    description: 'Tự tạo bộ ôn tập từ từ vựng và ghi chú ngữ pháp.',
    path: '/flashcards',
    icon: 'FC',
    tone: 'rose',
    category: 'study',
  },
  {
    title: 'Văn hóa',
    description: 'Khám phá truyền thống, phong tục và đời sống hiện đại phía sau ngôn ngữ.',
    path: '/culture',
    icon: 'CU',
    tone: 'teal',
    category: 'explore',
  },
  {
    title: 'Chat với AI',
    description: 'Hỏi giải thích, ví dụ và gợi ý khi bạn bị kẹt.',
    path: '/assistant',
    icon: 'AI',
    tone: 'violet',
    category: 'explore',
  },
]

export const GUIDE_STEPS = [
  {
    id: 1,
    title: 'Học Hiragana và Katakana',
    description:
      'Bắt đầu từ hệ chữ viết tiếng Nhật để xây nền tảng chắc.',
    tone: 'pink',
  },
  {
    id: 2,
    title: 'Học theo bài có cấu trúc',
    description: 'Tiến bộ qua hơn 200 bài học từ cơ bản đến nâng cao.',
    tone: 'purple',
  },
  {
    id: 3,
    title: 'Tạo flashcard',
    description: 'Lưu từ vựng và điểm ngữ pháp vào bộ ôn tập riêng.',
    tone: 'blue',
  },
  {
    id: 4,
    title: 'Đắm mình trong văn hóa',
    description: 'Tìm hiểu truyền thống, phong tục và đời sống hiện đại của Nhật Bản.',
    tone: 'green',
  },
]
