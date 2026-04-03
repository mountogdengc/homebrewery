import { renderRichText } from '../../utils/richText'

export default function Letter({ data }) {
  return (
    <div style={{
      background: '#faf8f3',
      border: '1px solid #d8d0b8',
      padding: '44px 52px',
      fontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
      color: '#1a1a10',
      minWidth: '420px',
      maxWidth: '560px',
      lineHeight: 1.75,
      boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{ textAlign: 'right', fontSize: '0.83rem', marginBottom: '28px', color: '#6a6a50' }}>
        {data.location && <div>{data.location}</div>}
        <div>{data.date}</div>
      </div>

      <div style={{ marginBottom: '20px', fontSize: '0.93rem' }}>{data.recipient}</div>

      {renderRichText(data.body, { fontSize: '0.9rem', textIndent: '1.6em' })}

      <div style={{ marginTop: '32px' }}>
        <div style={{ fontSize: '0.87rem', marginBottom: '24px' }}>{data.closing}</div>
        <div style={{ fontStyle: 'italic', fontSize: '0.95rem', paddingLeft: '16px' }}>{data.signature}</div>
      </div>

      {data.postscript && (
        <div style={{ marginTop: '24px', fontSize: '0.8rem', borderTop: '1px solid #d8d0b8',
                      paddingTop: '12px', color: '#6a6a50', fontStyle: 'italic' }}>
          P.S. {data.postscript}
        </div>
      )}
    </div>
  )
}
