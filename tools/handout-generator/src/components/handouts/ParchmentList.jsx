import { renderRichText } from '../../utils/richText'

const S = {
  wrapper: {
    background: 'linear-gradient(135deg, #f4e0b0 0%, #ede0c0 60%, #f0d8a8 100%)',
    border: '2px solid #8b6914',
    borderRadius: '2px',
    padding: '28px 32px 28px 52px',
    fontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
    color: '#2a1a06',
    minWidth: '520px',
    maxWidth: '660px',
    position: 'relative',
    boxShadow: '0 6px 24px rgba(0,0,0,0.45), inset 0 0 40px rgba(139,105,20,0.07)',
  },
  title: {
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: '20px',
    letterSpacing: '0.03em',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' },
  th: {
    borderBottom: '1px solid #8b6914',
    padding: '4px 8px',
    textAlign: 'left',
    fontSize: '0.76rem',
    fontStyle: 'italic',
    color: '#5a3e14',
    fontWeight: 'normal',
  },
  td:         { padding: '5px 8px', borderBottom: '1px solid rgba(139,105,20,0.18)', verticalAlign: 'top' },
  checkCell:  { padding: '5px 6px', borderBottom: '1px solid rgba(139,105,20,0.18)', fontSize: '1rem', color: '#5a3e14' },
  marginal: {
    position: 'absolute',
    left: '-2px',
    top: '50%',
    transform: 'translateY(-50%) rotate(-90deg)',
    transformOrigin: 'center center',
    fontSize: '0.7rem',
    fontStyle: 'italic',
    color: '#8b4513',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
    opacity: 0.85,
  },
  footer: {
    marginTop: '14px',
    fontSize: '0.76rem',
    fontStyle: 'italic',
    color: '#5a3e14',
    borderTop: '1px solid rgba(139,105,20,0.3)',
    paddingTop: '8px',
  },
}

export default function ParchmentList({ data }) {
  return (
    <div style={S.wrapper}>
      {data.marginalNote && <div style={S.marginal}>{data.marginalNote}</div>}

      <div style={S.title}>{data.title}</div>

      <table style={S.table}>
        <thead>
          <tr>
            {data.showCheckbox && <th style={{ ...S.th, width: '20px' }} />}
            <th style={S.th}>{data.colHeaders.col1}</th>
            <th style={S.th}>{data.colHeaders.col2}</th>
            <th style={S.th}>{data.colHeaders.col3}</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map(row => (
            <tr key={row.id}>
              {data.showCheckbox && <td style={S.checkCell}>{row.checked ? '☑' : '☐'}</td>}
              <td style={S.td}>{row.col1}</td>
              <td style={S.td}>{row.col2}</td>
              <td style={S.td}>{row.col3}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.footerNote && <div style={S.footer}>{renderRichText(data.footerNote, { fontSize: '0.76rem' })}</div>}
    </div>
  )
}
