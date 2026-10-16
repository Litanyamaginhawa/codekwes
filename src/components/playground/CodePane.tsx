import CodeMirror from '@uiw/react-codemirror'
import { css as cssLang } from '@codemirror/lang-css'
import { html as htmlLang } from '@codemirror/lang-html'
import { javascript as jsLang } from '@codemirror/lang-javascript'

export type PaneLang = 'html' | 'css' | 'js'

const EXTENSIONS = {
  html: [htmlLang()],
  css: [cssLang()],
  js: [jsLang()],
}

interface CodePaneProps {
  lang: PaneLang
  value: string
  onChange: (value: string) => void
}

export default function CodePane({ lang, value, onChange }: CodePaneProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      theme="dark"
      extensions={EXTENSIONS[lang]}
      basicSetup={{
        foldGutter: false,
        autocompletion: false,
        highlightActiveLine: true,
        tabSize: 2,
      }}
      className="h-full overflow-hidden text-left"
    />
  )
}
