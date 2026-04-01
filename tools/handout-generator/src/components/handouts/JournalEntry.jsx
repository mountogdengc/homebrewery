const LINE_H = 28

export default function JournalEntry({ data }) {
  const paragraphs = data.body.split('\n\n').filter(Boolean)

  return (
    <div style={{
      background: '#f8f0dc',
      padding: '32px 44px 40px',
      fontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
      color: '#2a2010',
      minWidth: '400px',
      maxWidth: '520px',
      lineHeight: `${LINE_H}px`,
      backgroundImage: `repeating-linear-gradient(
        transparent, transparent ${LINE_H - 1}px,
        rgba(100,90,60,0.14) ${LINE_H - 1}px,
        rgba(100,90,60,0.14) ${LINE_H}px
      )`,
      backgroundPositionY: '32px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.83rem', fontStyle: 'italic', color: '#6a5a30',
        marginBottom: '14px', borderBottom: '1px solid rgba(100,90,60,0.25)',
        paddingBottom: '8px',
      }}>
        <span>{data.date}</span>
        {data.location && <span>{data.location}</span>}
      </div>

      {paragraphs.map((p, i) => (
        <p key={i} style={{ marginBottom: `${LINE_H}px`, fontSize: '0.88rem' }}>{p}</p>
      ))}

      {data.author && (
        <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '0.83rem', color: '#6a5a30', marginTop: '8px' }}>
          — {data.author}
        </div>
      )}
    </div>
  )
}
