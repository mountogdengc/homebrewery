import { renderRichText } from '../../utils/richText'

export default function TavernNotice({ data }) {
  return (
    <div style={{
      background: '#f0e8d0',
      border: '3px solid #1a0800',
      outline: '1px solid #1a0800',
      outlineOffset: '5px',
      padding: '28px 32px',
      fontFamily: "'Times New Roman', Times, serif",
      color: '#1a0800',
      minWidth: '360px',
      maxWidth: '460px',
      textAlign: 'center',
      boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: '1.65rem', fontWeight: 'bold', letterSpacing: '0.07em',
                    lineHeight: 1.15, textTransform: 'uppercase', marginBottom: '10px' }}>
        {data.headline}
      </div>

      {data.subheadline && (
        <div style={{ fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '16px',
                      borderBottom: '1px solid #1a0800', paddingBottom: '12px' }}>
          {data.subheadline}
        </div>
      )}

      <div style={{ fontSize: '0.88rem', lineHeight: 1.65, textAlign: 'left',
                    marginBottom: '12px' }}>
        {renderRichText(data.body)}
      </div>

      {data.reward && (
        <div style={{ border: '2px solid #1a0800', padding: '8px 16px', margin: '16px 0',
                      fontSize: '1.05rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>
          REWARD: {data.reward}
        </div>
      )}

      <div style={{ borderTop: '1px solid #1a0800', paddingTop: '10px', marginTop: '16px',
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.78rem', fontStyle: 'italic' }}>
        <span>{data.issuer}</span>
        <span>{data.date}</span>
      </div>
    </div>
  )
}
