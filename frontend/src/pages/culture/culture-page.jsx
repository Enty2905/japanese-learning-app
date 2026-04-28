import { useMemo, useState } from 'react'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './culture-page.css'

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'food', label: 'Ẩm thực' },
  { id: 'fashion', label: 'Thời trang' },
  { id: 'culture', label: 'Văn hóa' },
  { id: 'study', label: 'Học tập' },
  { id: 'work', label: 'Đi làm' },
]

const CULTURE_ARTICLES = [
  {
    id: 'washoku',
    category: 'food',
    categoryLabel: 'Ẩm thực',
    title: 'Washoku và cách người Nhật kể chuyện mùa qua bữa ăn',
    japaneseTitle: '和食',
    readTime: '6 phút đọc',
    accent: 'coral',
    visual: '食',
    visualCaption: 'Bữa ăn theo mùa',
    summary:
      'Ẩm thực Nhật không chỉ là sushi hay ramen. Tinh thần washoku đặt sự cân bằng, mùa vụ và cách trình bày lên cùng một bàn ăn.',
    details: [
      'Một bữa cơm gia đình thường xoay quanh cơm trắng, canh, món chính, món phụ và dưa muối. Cách sắp xếp này giúp người học dễ hiểu vì sao nhiều từ vựng về món ăn gắn với mùa và địa phương.',
      'Khi học tiếng Nhật qua ẩm thực, hãy để ý các từ như shun, dashi, miso, gohan. Chúng xuất hiện nhiều trong hội thoại đời sống và giúp bạn hiểu cách người Nhật nói về cảm giác ngon, sự tinh tế và lòng hiếu khách.',
    ],
    vocabulary: ['ごはん', '味噌汁', '旬', 'だし'],
  },
  {
    id: 'street-fashion',
    category: 'fashion',
    categoryLabel: 'Thời trang',
    title: 'Từ kimono đến street style: thời trang Nhật vừa kỷ luật vừa tự do',
    japaneseTitle: 'ファッション',
    readTime: '5 phút đọc',
    accent: 'violet',
    visual: '装',
    visualCaption: 'Kimono và phố hiện đại',
    summary:
      'Thời trang Nhật tạo ấn tượng bởi sự chỉn chu trong lễ nghi và khả năng thử nghiệm táo bạo ở các khu phố trẻ.',
    details: [
      'Kimono, yukata và hakama thường gắn với dịp lễ, tốt nghiệp hoặc sự kiện truyền thống. Mỗi lớp áo, dây thắt và họa tiết đều có vai trò riêng nên người mặc cần chuẩn bị rất cẩn thận.',
      'Ở đời sống hiện đại, Harajuku, Shibuya hay Shimokitazawa lại đại diện cho tinh thần phối đồ cá nhân. Điều thú vị là sự nổi bật vẫn thường đi cùng cảm giác gọn gàng và có chủ đích.',
    ],
    vocabulary: ['着物', '浴衣', '服', 'おしゃれ'],
  },
  {
    id: 'matsuri',
    category: 'culture',
    categoryLabel: 'Văn hóa',
    title: 'Matsuri: lễ hội khiến cộng đồng trở thành một sân khấu sống',
    japaneseTitle: '祭り',
    readTime: '7 phút đọc',
    accent: 'teal',
    visual: '祭',
    visualCaption: 'Lễ hội địa phương',
    summary:
      'Lễ hội Nhật Bản là nơi truyền thống, âm nhạc, ẩm thực đường phố và tinh thần cộng đồng cùng xuất hiện.',
    details: [
      'Matsuri thường gắn với đền, mùa vụ hoặc lịch sử của từng vùng. Người dân khiêng mikoshi, mặc happi, đánh trống taiko và chuẩn bị gian hàng trong nhiều ngày.',
      'Với người học tiếng Nhật, lễ hội là cách tự nhiên để học những lời chào, cách mời gọi, từ chỉ địa điểm và tên món ăn đường phố như takoyaki, yakisoba hay kakigori.',
    ],
    vocabulary: ['祭り', '神社', '太鼓', '屋台'],
  },
  {
    id: 'study-life',
    category: 'study',
    categoryLabel: 'Học tập',
    title: 'Một ngày học ở Nhật: đúng giờ, tự quản và nhiều hoạt động nhóm',
    japaneseTitle: '学校生活',
    readTime: '6 phút đọc',
    accent: 'blue',
    visual: '学',
    visualCaption: 'Lớp học và câu lạc bộ',
    summary:
      'Môi trường học tập ở Nhật đề cao thói quen đúng giờ, chuẩn bị trước và trách nhiệm với tập thể.',
    details: [
      'Học sinh thường có lịch học, hoạt động câu lạc bộ và nhiệm vụ trực nhật rõ ràng. Việc cùng dọn lớp hoặc chuẩn bị sự kiện giúp rèn ý thức nhóm ngay trong sinh hoạt hằng ngày.',
      'Nếu chuẩn bị du học, bạn nên làm quen với các cụm như shukudai, jugyo, kurabu và sensei. Đây là những từ xuất hiện liên tục khi trao đổi với giáo viên và bạn học.',
    ],
    vocabulary: ['授業', '宿題', '先生', 'クラブ'],
  },
  {
    id: 'work-culture',
    category: 'work',
    categoryLabel: 'Đi làm',
    title: 'Đi làm ở Nhật: báo cáo, trao đổi và xác nhận để giảm sai sót',
    japaneseTitle: '仕事文化',
    readTime: '8 phút đọc',
    accent: 'green',
    visual: '働',
    visualCaption: 'Văn phòng và nhóm dự án',
    summary:
      'Văn hóa công sở Nhật nổi tiếng với sự cẩn trọng trong giao tiếp, quy trình và cách phối hợp giữa các thành viên.',
    details: [
      'Khái niệm horenso gồm báo cáo, liên lạc và trao đổi ý kiến. Mục tiêu không phải tạo thêm thủ tục, mà là giúp nhóm nắm tình hình sớm để tránh lỗi dây chuyền.',
      'Người mới đi làm nên chú ý kính ngữ, cách xác nhận deadline và thói quen ghi chú sau cuộc họp. Những điều nhỏ này thường quyết định cảm giác chuyên nghiệp trong môi trường Nhật.',
    ],
    vocabulary: ['仕事', '会社', '報告', '確認'],
  },
  {
    id: 'omotenashi',
    category: 'culture',
    categoryLabel: 'Văn hóa',
    title: 'Omotenashi: lòng hiếu khách nằm trong những chi tiết rất nhỏ',
    japaneseTitle: 'おもてなし',
    readTime: '5 phút đọc',
    accent: 'rose',
    visual: '心',
    visualCaption: 'Phục vụ và sự tinh tế',
    summary:
      'Omotenashi là cách phục vụ dự đoán nhu cầu của người khác mà không làm họ thấy bị áp lực.',
    details: [
      'Bạn có thể thấy tinh thần này ở cách nhân viên gói hàng, hướng dẫn đường, đặt khăn nóng hoặc cúi chào khi khách rời đi. Mỗi hành động đều ngắn gọn nhưng có chủ ý.',
      'Khi học tiếng Nhật, omotenashi giúp bạn hiểu vì sao nhiều mẫu câu lịch sự không dịch từng chữ được. Chúng mang theo khoảng cách, sự tôn trọng và mong muốn làm người nghe thoải mái.',
    ],
    vocabulary: ['心', '丁寧', '案内', '感謝'],
  },
]

const CULTURE_NOTES = [
  {
    title: 'Học qua bối cảnh',
    text: 'Mỗi bài viết có từ vựng ngắn để bạn nối nội dung văn hóa với phần học tiếng Nhật.',
  },
  {
    title: 'Đọc theo chủ đề',
    text: 'Dùng bộ lọc để đi từ ẩm thực, lễ hội đến học tập và công sở tùy mục tiêu của bạn.',
  },
  {
    title: 'Ghi nhớ bằng chi tiết',
    text: 'Tập trung vào thói quen, đồ vật và câu nói đời thường thay vì chỉ học khái niệm chung.',
  },
]

function CultureHero({ articleCount }) {
  return (
    <section className="culture-hero">
      <div className="culture-hero__copy">
        <span className="culture-eyebrow">Japan culture blog</span>
        <h1>Văn hóa Nhật Bản</h1>
        <p>
          Khám phá ẩm thực, thời trang, lễ hội, học tập và môi trường làm việc để việc học
          tiếng Nhật có thêm bối cảnh đời sống.
        </p>

        <div className="culture-hero__actions">
          <a href="#culture-reader" className="culture-primary-link">Đọc bài nổi bật</a>
          <a href="#culture-articles" className="culture-secondary-link">Xem danh mục</a>
        </div>
      </div>

      <div className="culture-hero__visual" aria-label={`${articleCount} bài viết văn hóa`}>
        <div className="culture-visual-board">
          <span>日</span>
          <span>本</span>
          <span>文</span>
          <span>化</span>
        </div>
        <div className="culture-hero__stat">
          <strong>{articleCount}</strong>
          <span>bài viết chọn lọc</span>
        </div>
      </div>
    </section>
  )
}

function CultureCategoryBar({ activeCategory, onCategoryChange }) {
  return (
    <section className="culture-category-bar" aria-label="Danh mục văn hóa">
      {CATEGORY_FILTERS.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`culture-category-btn${activeCategory === category.id ? ' is-active' : ''}`}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.label}
        </button>
      ))}
    </section>
  )
}

function CultureArticleCard({ article, isSelected, onSelect }) {
  return (
    <article className={`culture-article-card${isSelected ? ' is-selected' : ''}`}>
      <button type="button" onClick={() => onSelect(article.id)}>
        <div className={`culture-article-visual culture-article-visual--${article.accent}`}>
          <span>{article.visual}</span>
          <small>{article.visualCaption}</small>
        </div>

        <div className="culture-article-card__body">
          <div className="culture-article-meta">
            <span>{article.categoryLabel}</span>
            <span>{article.readTime}</span>
          </div>
          <h2>{article.title}</h2>
          <p>{article.summary}</p>
        </div>
      </button>
    </article>
  )
}

function CultureReader({ article }) {
  return (
    <aside id="culture-reader" className="culture-reader" aria-label="Bài viết đang đọc">
      <div className={`culture-reader__cover culture-reader__cover--${article.accent}`}>
        <span>{article.visual}</span>
      </div>

      <div className="culture-reader__body">
        <div className="culture-article-meta">
          <span>{article.categoryLabel}</span>
          <span>{article.readTime}</span>
        </div>
        <p className="culture-reader__jp-title">{article.japaneseTitle}</p>
        <h2>{article.title}</h2>
        {article.details.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        <section className="culture-vocabulary" aria-label="Từ vựng gợi ý">
          <h3>Từ vựng nên nhớ</h3>
          <div>
            {article.vocabulary.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

function CultureNotes() {
  return (
    <section className="culture-notes" aria-labelledby="culture-notes-title">
      <div className="culture-section-heading">
        <span>Gợi ý đọc</span>
        <h2 id="culture-notes-title">Biến văn hóa thành ngữ cảnh học tiếng Nhật</h2>
      </div>

      <div className="culture-notes__grid">
        {CULTURE_NOTES.map((note) => (
          <article key={note.title} className="culture-note-card">
            <h3>{note.title}</h3>
            <p>{note.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function CulturePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedArticleId, setSelectedArticleId] = useState(CULTURE_ARTICLES[0].id)

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') {
      return CULTURE_ARTICLES
    }

    return CULTURE_ARTICLES.filter((article) => article.category === activeCategory)
  }, [activeCategory])

  const selectedArticle =
    CULTURE_ARTICLES.find((article) => article.id === selectedArticleId) || CULTURE_ARTICLES[0]

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId)

    if (categoryId === 'all') {
      setSelectedArticleId(CULTURE_ARTICLES[0].id)
      return
    }

    const nextArticle = CULTURE_ARTICLES.find((article) => article.category === categoryId)

    if (nextArticle) {
      setSelectedArticleId(nextArticle.id)
    }
  }

  return (
    <div className="culture-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="culture-main">
        <CultureHero articleCount={CULTURE_ARTICLES.length} />
        <CultureCategoryBar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

        <section id="culture-articles" className="culture-content-grid" aria-label="Blog văn hóa Nhật Bản">
          <div className="culture-article-list">
            {filteredArticles.map((article) => (
              <CultureArticleCard
                key={article.id}
                article={article}
                isSelected={article.id === selectedArticle.id}
                onSelect={setSelectedArticleId}
              />
            ))}
          </div>

          <CultureReader article={selectedArticle} />
        </section>

        <CultureNotes />
      </main>
    </div>
  )
}
