export default function OfficialWrit({ data }) {
  const paragraphs = data.body.split('\n\n').filter(Boolean)

  return (
    <div style={{
      background: '#faf6e8',
      border: '1px solid #8a7a50',
      outline: '4px double #8a7a50',
      outlineOffset: '6px',
      padding: '36px 44px',
      fontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
      color: '#1a1608',
      minWidth: '460px',
      maxWidth: '580px',
      textAlign: 'center',
      boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{ fontSize: '0.78rem', letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: '#6a5a20', marginBottom: '6px' }}>
        {data.authority}
      </div>

      <div style={{ width: '60%', height: '1px', background: '#8a7a50', margin: '8px auto' }} />

      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: '6px' }}>
        {data.title}
      </div>

      <div style={{ width: '60%', height: '1px', background: '#8a7a50', margin: '8px auto 20px' }} />

      {data.recipient && (
        <div style={{ textAlign: 'left', fontStyle: 'italic',
                      fontSize: '0.88rem', marginBottom: '16px' }}>
          {data.recipient}
        </div>
      )}

      <div style={{ textAlign: 'left' }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{ marginBottom: '12px', fontSize: '0.86rem',
                              lineHeight: 1.65, textIndent: '1.5em' }}>
            {p}
          </p>
        ))}
      </div>

      <div style={{ width: '60%', height: '1px', background: '#8a7a50', margin: '20px auto 16px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {/* Seal */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px',
            border: '2px solid #8a7a50', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 4px',
            fontSize: '0.58rem', letterSpacing: '0.08em',
            color: '#6a5a20', padding: '8px',
            boxShadow: 'inset 0 0 8px rgba(138,122,80,0.2)',
          }}>
            {data.sealLabel}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#8a7a50', fontStyle: 'italic' }}>
            [seal]
          </div>
        </div>

        {/* Signature block */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ width: '160px', height: '1px', background: '#8a7a50', marginBottom: '5px', marginLeft: 'auto' }} />
          <div style={{ fontSize: '0.83rem', fontStyle: 'italic' }}>{data.signatoryName}</div>
          <div style={{ fontSize: '0.72rem', color: '#6a5a20', marginTop: '2px' }}>{data.signatoryTitle}</div>
          <div style={{ fontSize: '0.72rem', color: '#8a7a50', marginTop: '6px', fontStyle: 'italic' }}>{data.date}</div>
        </div>
      </div>
    </div>
  )
}
