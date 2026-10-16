import { forwardRef } from 'react'

interface PreviewPaneProps {
  srcDoc: string
  /** Changing this value forces the iframe to reload and re-run the code. */
  runId: number
}

const PreviewPane = forwardRef<HTMLIFrameElement, PreviewPaneProps>(function PreviewPane(
  { srcDoc, runId },
  ref,
) {
  return (
    <iframe
      key={runId}
      ref={ref}
      title="Live preview"
      sandbox="allow-scripts allow-modals"
      srcDoc={srcDoc}
      className="h-full w-full bg-white"
    />
  )
})

export default PreviewPane
