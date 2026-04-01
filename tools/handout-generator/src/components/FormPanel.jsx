import ParchmentListForm from './forms/ParchmentListForm'
import TavernNoticeForm  from './forms/TavernNoticeForm'
import LetterForm        from './forms/LetterForm'
import JournalEntryForm  from './forms/JournalEntryForm'
import OfficialWritForm  from './forms/OfficialWritForm'

const FORM_MAP = {
  'parchment-list': ParchmentListForm,
  'tavern-notice':  TavernNoticeForm,
  'letter':         LetterForm,
  'journal-entry':  JournalEntryForm,
  'official-writ':  OfficialWritForm,
}

export default function FormPanel({ type, data, onChange }) {
  const Form = FORM_MAP[type]
  return <Form data={data} onChange={onChange} />
}
