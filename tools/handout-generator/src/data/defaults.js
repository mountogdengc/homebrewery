export const TYPES = [
  { id: 'parchment-list', label: 'Parchment List' },
  { id: 'tavern-notice',  label: 'Tavern Notice'  },
  { id: 'letter',         label: 'Letter'         },
  { id: 'journal-entry',  label: 'Journal Entry'  },
  { id: 'official-writ',  label: 'Official Writ'  },
]

export const defaultData = {
  'parchment-list': {
    title: 'Milk — Amber Wheel — For Grandmother',
    colHeaders: { col1: 'Creature', col2: 'Where', col3: 'Cheese' },
    showCheckbox: true,
    rows: [
      { id: 1, checked: false, col1: 'Cockatrice',     col2: 'Old barn, north field road',    col3: 'Stonebite wheel'  },
      { id: 2, checked: false, col1: 'Displacer Beast',col2: 'Thornwood Forest, east track',  col3: 'Shadowcurd'       },
      { id: 3, checked: false, col1: 'Catoblepas',     col2: 'Deadmere Bog, south marsh',     col3: 'Deadmere Rind'    },
      { id: 4, checked: false, col1: 'Wyvern',         col2: 'High Pass, Sword Mountains',    col3: 'Stingwheel'       },
      { id: 5, checked: false, col1: 'Chimera',        col2: 'Ironstone Plateau',             col3: "Founder's Gold"   },
    ],
    footerNote: '',
    marginalNote: "Don't look at it.",
  },
  'tavern-notice': {
    headline:    'ADVENTURERS WANTED',
    subheadline: 'Unusual Work. Modest Pay. Good Cause.',
    body:        'Capable hands needed for delicate collection work.\nExperience with difficult animals preferred.\nDiscretion expected.\n\nAsk for Fern at the Golden Pail.',
    reward:      '',
    issuer:      'Posted by F. Goodbarrel',
    date:        'The 14th of Mirtul',
  },
  'letter': {
    date:        'The 14th of Mirtul',
    location:    'Goldenfields',
    recipient:   'Dear Fern,',
    body:        'I am writing to tell you that the pails are ready and the bottles have been checked. Grandmother has seen to the enchantments herself, despite everything.\n\nYou know what to do. You have always known.\n\nBe careful on the plateau.',
    closing:     'With love,',
    signature:   'Your mother',
    postscript:  '',
  },
  'journal-entry': {
    date:     '14 Mirtul',
    location: 'Goldenfields',
    body:     "Hired the party today. They asked good questions. One of them looked at the list for a long time before saying anything.\n\nGrandmother gave them the charm. She didn't say goodbye to me the way I expected. She just nodded and went back inside.\n\nWe leave at first light.",
    author:   'F.G.',
  },
  'official-writ': {
    authority:       'THE ABBEY OF CHAUNTEA',
    title:           'WRIT OF PASSAGE',
    recipient:       'To all whom it may concern:',
    body:            "Let it be known that the bearer of this document travels under the blessing and sanction of the Abbey of Chauntea in Goldenfields. They are engaged in work of agricultural and spiritual significance to this community.\n\nWe ask that all persons afford them safe passage and such assistance as they may require.",
    date:            'The 14th of Mirtul, Year of the Scarlet Witch',
    sealLabel:       'SEAL OF CHAUNTEA',
    signatoryTitle:  'Lay Administrator',
    signatoryName:   'Brother Aldric Voss',
  },
}
