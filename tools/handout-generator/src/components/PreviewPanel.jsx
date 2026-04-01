import ParchmentList from './handouts/ParchmentList'
import TavernNotice  from './handouts/TavernNotice'
import Letter        from './handouts/Letter'
import JournalEntry  from './handouts/JournalEntry'
import OfficialWrit  from './handouts/OfficialWrit'

const HANDOUT_MAP = {
  'parchment-list': ParchmentList,
  'tavern-notice':  TavernNotice,
  'letter':         Letter,
  'journal-entry':  JournalEntry,
  'official-writ':  OfficialWrit,
}

export default function PreviewPanel({ type, data }) {
  const Handout = HANDOUT_MAP[type]
  return <Handout data={data} />
}
