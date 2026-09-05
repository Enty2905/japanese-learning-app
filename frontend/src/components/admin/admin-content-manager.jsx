import { useEffect, useMemo, useState } from 'react'
import {
  createAdminContent,
  deleteAdminContent,
  fetchAdminContent,
  updateAdminContent,
} from '../../services/admin.service'

const JLPT_OPTIONS = ['N5', 'N4', 'N3', 'N2', 'N1']
const CONTENT_LIMIT = 6

const CONTENT_CONFIGS = {
  vocabulary: {
    label: 'Từ vựng',
    title: 'Kho từ vựng',
    nameKey: 'word',
    emptyForm: {
      word: '',
      kana: '',
      romaji: '',
      meaningVi: '',
      meaningEn: '',
      wordType: '',
      jlptLevel: '',
      lessonNumber: '',
      accent: '',
      audioUrl: '',
      imageUrl: '',
      notes: '',
      tags: '',
    },
    fields: [
      { name: 'word', label: 'Từ vựng', required: true },
      { name: 'kana', label: 'Kana' },
      { name: 'romaji', label: 'Romaji' },
      { name: 'meaningVi', label: 'Nghĩa tiếng Việt', required: true, type: 'textarea' },
      { name: 'meaningEn', label: 'Nghĩa tiếng Anh', type: 'textarea' },
      { name: 'wordType', label: 'Loại từ' },
      { name: 'jlptLevel', label: 'JLPT', type: 'jlpt' },
      { name: 'lessonNumber', label: 'Bài học', type: 'number' },
      { name: 'accent', label: 'Trọng âm' },
      { name: 'audioUrl', label: 'Audio URL' },
      { name: 'imageUrl', label: 'Image URL' },
      { name: 'tags', label: 'Tags', placeholder: 'tag 1, tag 2' },
      { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    ],
    columns: [
      { key: 'word', label: 'Từ' },
      { key: 'kana', label: 'Kana' },
      { key: 'meaningVi', label: 'Nghĩa' },
      { key: 'jlptLevel', label: 'JLPT' },
      { key: 'lessonNumber', label: 'Bài' },
    ],
  },
  kanji: {
    label: 'Kanji',
    title: 'Kho Kanji',
    nameKey: 'kanji',
    emptyForm: {
      kanji: '',
      onyomi: '',
      kunyomi: '',
      meaningVi: '',
      meaningEn: '',
      strokeCount: '',
      radical: '',
      jlptLevel: '',
      unicodeCode: '',
      writingSvgUrl: '',
      hanViet: '',
      mnemonic: '',
    },
    fields: [
      { name: 'kanji', label: 'Kanji', required: true },
      { name: 'onyomi', label: 'Onyomi' },
      { name: 'kunyomi', label: 'Kunyomi' },
      { name: 'meaningVi', label: 'Nghĩa tiếng Việt', required: true, type: 'textarea' },
      { name: 'meaningEn', label: 'Nghĩa tiếng Anh', type: 'textarea' },
      { name: 'strokeCount', label: 'Số nét', type: 'number' },
      { name: 'radical', label: 'Bộ thủ' },
      { name: 'jlptLevel', label: 'JLPT', type: 'jlpt' },
      { name: 'unicodeCode', label: 'Unicode' },
      { name: 'writingSvgUrl', label: 'Writing SVG URL' },
      { name: 'hanViet', label: 'Hán Việt' },
      { name: 'mnemonic', label: 'Mẹo nhớ', type: 'textarea' },
    ],
    columns: [
      { key: 'kanji', label: 'Kanji' },
      { key: 'hanViet', label: 'Hán Việt' },
      { key: 'meaningVi', label: 'Nghĩa' },
      { key: 'jlptLevel', label: 'JLPT' },
      { key: 'strokeCount', label: 'Nét' },
    ],
  },
  grammar: {
    label: 'Ngữ pháp',
    title: 'Điểm ngữ pháp',
    nameKey: 'pattern',
    emptyForm: {
      lessonNumber: '',
      position: '',
      title: '',
      pattern: '',
      meaningVi: '',
      formation: '',
      explanation: '',
      usageNote: '',
      restriction: '',
      nuance: '',
      jlptLevel: '',
    },
    fields: [
      { name: 'title', label: 'Tiêu đề' },
      { name: 'pattern', label: 'Mẫu ngữ pháp', required: true },
      { name: 'meaningVi', label: 'Nghĩa tiếng Việt', required: true, type: 'textarea' },
      { name: 'jlptLevel', label: 'JLPT', type: 'jlpt', required: true },
      { name: 'lessonNumber', label: 'Bài học', type: 'number', required: true },
      { name: 'position', label: 'Thứ tự trong bài', type: 'number' },
      { name: 'formation', label: 'Cách tạo câu', type: 'textarea' },
      { name: 'explanation', label: 'Giải thích', type: 'textarea' },
      { name: 'usageNote', label: 'Ghi chú dùng', type: 'textarea' },
      { name: 'restriction', label: 'Giới hạn', type: 'textarea' },
      { name: 'nuance', label: 'Sắc thái', type: 'textarea' },
    ],
    columns: [
      { key: 'pattern', label: 'Mẫu' },
      { key: 'title', label: 'Tiêu đề' },
      { key: 'meaningVi', label: 'Nghĩa' },
      { key: 'jlptLevel', label: 'JLPT' },
      { key: 'lessonNumber', label: 'Bài' },
      { key: 'position', label: 'Thứ tự' },
    ],
  },
}

function createEmptyForm(contentType) {
  return { ...CONTENT_CONFIGS[contentType].emptyForm }
}

function getItemName(config, item) {
  return item?.[config.nameKey] || item?.title || `#${item?.id}`
}

function formatCellValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return value
}

function buildFormValues(config, item) {
  const formValues = createEmptyForm(Object.keys(CONTENT_CONFIGS).find(
    (contentType) => CONTENT_CONFIGS[contentType] === config,
  ))

  for (const field of config.fields) {
    const value = item[field.name]
    formValues[field.name] = Array.isArray(value) ? value.join(', ') : value ?? ''
  }

  return formValues
}

function AdminContentField({ field, value, onChange }) {
  const handleChange = (event) => {
    onChange(field.name, event.target.value)
  }

  if (field.type === 'textarea') {
    return (
      <label className="admin-content-field">
        <span>{field.label}</span>
        <textarea
          value={value}
          required={field.required}
          placeholder={field.placeholder}
          onChange={handleChange}
        />
      </label>
    )
  }

  if (field.type === 'jlpt') {
    return (
      <label className="admin-content-field">
        <span>{field.label}</span>
        <select value={value} required={field.required} onChange={handleChange}>
          <option value="">Chưa chọn</option>
          {JLPT_OPTIONS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label className="admin-content-field">
      <span>{field.label}</span>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        min={field.type === 'number' ? '1' : undefined}
        value={value}
        required={field.required}
        placeholder={field.placeholder}
        onChange={handleChange}
      />
    </label>
  )
}

function AdminContentForm({
  config,
  editingItem,
  formValues,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}) {
  return (
    <form className="admin-content-form" onSubmit={onSubmit}>
      <header>
        <h3>{editingItem ? `Sửa ${config.label}` : `Thêm ${config.label}`}</h3>
        {editingItem ? (
          <button type="button" className="admin-link-btn" onClick={onCancel}>
            Hủy
          </button>
        ) : null}
      </header>
      <div className="admin-content-form__grid">
        {config.fields.map((field) => (
          <AdminContentField
            key={field.name}
            field={field}
            value={formValues[field.name] ?? ''}
            onChange={onChange}
          />
        ))}
      </div>
      <button type="submit" className="admin-content-submit" disabled={isSaving}>
        {isSaving ? 'Đang lưu' : editingItem ? 'Lưu thay đổi' : 'Thêm mới'}
      </button>
    </form>
  )
}

function AdminContentTable({
  config,
  isDeletingId,
  items,
  onDelete,
  onEdit,
}) {
  if (items.length === 0) {
    return <p className="admin-empty">Không tìm thấy nội dung phù hợp.</p>
  }

  return (
    <div className="admin-content-table-wrap" tabIndex={0} role="region" aria-label="Bảng nội dung, cuộn ngang để xem thêm cột">
      <table className="admin-content-table">
        <thead>
          <tr>
            {config.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th aria-label="Thao tác" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {config.columns.map((column) => (
                <td key={column.key}>{formatCellValue(item[column.key])}</td>
              ))}
              <td>
                <div className="admin-content-actions">
                  <button type="button" onClick={() => onEdit(item)}>
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="admin-content-danger"
                    disabled={isDeletingId === item.id}
                    onClick={() => onDelete(item)}
                  >
                    {isDeletingId === item.id ? 'Đang xóa' : 'Xóa'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminContentManager() {
  const [contentType, setContentType] = useState('vocabulary')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [jlptLevel, setJlptLevel] = useState('all')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [formValues, setFormValues] = useState(createEmptyForm('vocabulary'))
  const [editingItem, setEditingItem] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const config = CONTENT_CONFIGS[contentType]
  const filters = useMemo(
    () => ({
      page,
      limit: CONTENT_LIMIT,
      search,
      jlptLevel,
    }),
    [jlptLevel, page, search],
  )

  useEffect(() => {
    let isMounted = true

    async function loadContent() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const result = await fetchAdminContent(contentType, filters)

        if (!isMounted) {
          return
        }

        setItems(result.items)
        setPagination(result.pagination)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setItems([])
        setPagination(null)
        setErrorMessage(error.message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadContent()

    return () => {
      isMounted = false
    }
  }, [contentType, filters, reloadKey])

  const handleContentTypeChange = (nextType) => {
    setContentType(nextType)
    setSearchInput('')
    setSearch('')
    setJlptLevel('all')
    setPage(1)
    setEditingItem(null)
    setFormValues(createEmptyForm(nextType))
    setMessage('')
    setErrorMessage('')
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleFieldChange = (fieldName, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }))
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormValues(buildFormValues(config, item))
    setMessage('')
    setErrorMessage('')
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setFormValues(createEmptyForm(contentType))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      if (editingItem) {
        await updateAdminContent(contentType, editingItem.id, formValues)
        setMessage(`Đã cập nhật ${getItemName(config, editingItem)}.`)
      } else {
        await createAdminContent(contentType, formValues)
        setMessage(`Đã thêm ${config.label.toLowerCase()}.`)
      }

      setEditingItem(null)
      setFormValues(createEmptyForm(contentType))
      setReloadKey((currentKey) => currentKey + 1)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const itemName = getItemName(config, item)
    const confirmed = window.confirm(`Xóa "${itemName}"?`)

    if (!confirmed) {
      return
    }

    setIsDeletingId(item.id)
    setMessage('')
    setErrorMessage('')

    try {
      await deleteAdminContent(contentType, item.id)
      setMessage(`Đã xóa ${itemName}.`)
      if (editingItem?.id === item.id) {
        handleCancelEdit()
      }
      setReloadKey((currentKey) => currentKey + 1)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsDeletingId(null)
    }
  }

  const handlePageChange = (nextPage) => {
    setPage(nextPage)
  }

  return (
    <section className="admin-content-section" aria-labelledby="admin-content-title">
      <header className="admin-content-header">
        <div>
          <span>Content</span>
          <h2 id="admin-content-title">Quản lý nội dung học</h2>
        </div>
        <div className="admin-content-tabs" role="tablist" aria-label="Loại nội dung">
          {Object.entries(CONTENT_CONFIGS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={contentType === key}
              className={contentType === key ? 'is-active' : ''}
              onClick={() => handleContentTypeChange(key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {message ? <p className="admin-feedback admin-feedback--success">{message}</p> : null}
      {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

      <div className="admin-content-layout">
        <AdminContentForm
          config={config}
          editingItem={editingItem}
          formValues={formValues}
          isSaving={isSaving}
          onCancel={handleCancelEdit}
          onChange={handleFieldChange}
          onSubmit={handleSubmit}
        />

        <div className="admin-content-list">
          <header>
            <div>
              <h3>{config.title}</h3>
              {isLoading ? <span>Đang tải...</span> : null}
            </div>
            <form className="admin-content-filter" onSubmit={handleSearchSubmit}>
              <label>
                <span>Tìm</span>
                <input
                  type="search"
                  value={searchInput}
                  placeholder="Từ khóa"
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </label>
              <label>
                <span>JLPT</span>
                <select
                  value={jlptLevel}
                  onChange={(event) => {
                    setJlptLevel(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">Tất cả</option>
                  {JLPT_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Lọc</button>
            </form>
          </header>

          <AdminContentTable
            config={config}
            isDeletingId={isDeletingId}
            items={items}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />

          <footer className="admin-pagination">
            <span>
              {pagination?.total || 0} mục · Trang {pagination?.page || 1}/
              {pagination?.totalPages || 1}
            </span>
            <div>
              <button
                type="button"
                disabled={!pagination || pagination.page <= 1}
                onClick={() => handlePageChange((pagination?.page || 1) - 1)}
              >
                Trước
              </button>
              <button
                type="button"
                disabled={!pagination || pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange((pagination?.page || 1) + 1)}
              >
                Sau
              </button>
            </div>
          </footer>
        </div>
      </div>
    </section>
  )
}
