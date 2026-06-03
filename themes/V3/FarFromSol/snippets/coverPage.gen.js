import dedent from 'dedent';

export default function(){
	return dedent`
		{{frontCover}}

		{{coverLogoTopRight
		![pointed_hat](https://i.imgur.com/MiVsMKO.png)
		}}

		# Adventure Title
		## A Subtitle or Tagline

		{{adventureCode
		FR-DC-XXX-XX
		}}

		{{introBody
		A Dungeoncraft Adventure for Tier 1 Characters (Levels 1–4)

		*Optimized for APL 3*
		}}

		{{footnote
		Not for resale. Permission granted to print or photocopy this document for personal use only.
		}}

		\n`;
}
