/**
 * Browser port of freeCodeCamp's `Explorer` static-analysis helper
 * (`@freecodecamp/curriculum-helpers` → class/explorer.ts).
 *
 * FCC builds it on the TypeScript compiler API; CodeKwes uses acorn instead
 * (a fraction of the size) and reimplements the subset shipped workshops and
 * labs rely on:
 *
 *   const explorer = await __helpers.Explorer(code);
 *   explorer.variables.output?.matches("const output = document.getElementById('output')");
 *   explorer.allFunctions.getArtifactTitle?.hasReturn('artifact.title');
 *   explorer.allFunctions.add?.variables.node?.objectProps?.element?.value.matches('element');
 *
 * `matches`/`hasReturn` compare *structure*: quote style, whitespace and
 * semicolons are ignored — the same equivalence FCC gets by skipping semicolon
 * tokens and comparing unquoted leaf values instead of raw text.
 */
import { parse } from 'acorn'

type AnyNode = {
  type: string
  start: number
  end: number
  [key: string]: unknown
}

type ParseContext = 'source' | 'expression' | 'parameter'

const IGNORED_KEYS = new Set(['start', 'end', 'loc', 'range', 'raw', 'sourceType'])

const EXPRESSION_TYPES = new Set([
  'ArrayExpression',
  'ArrowFunctionExpression',
  'AssignmentExpression',
  'AwaitExpression',
  'BinaryExpression',
  'CallExpression',
  'ChainExpression',
  'ClassExpression',
  'ConditionalExpression',
  'FunctionExpression',
  'Identifier',
  'ImportExpression',
  'Literal',
  'LogicalExpression',
  'MemberExpression',
  'MetaProperty',
  'NewExpression',
  'ObjectExpression',
  'ParenthesizedExpression',
  'PrivateIdentifier',
  'SequenceExpression',
  'Super',
  'TaggedTemplateExpression',
  'TemplateLiteral',
  'ThisExpression',
  'UnaryExpression',
  'UpdateExpression',
  'YieldExpression',
])

function inferContext(node: AnyNode): ParseContext {
  // Default values, rest elements and destructuring patterns are parameters
  // when they appear in a function signature (FCC's isParameter guard).
  if (
    node.type === 'AssignmentPattern' ||
    node.type === 'RestElement' ||
    node.type === 'ObjectPattern' ||
    node.type === 'ArrayPattern'
  ) {
    return 'parameter'
  }
  return EXPRESSION_TYPES.has(node.type) ? 'expression' : 'source'
}

function parseProgram(code: string): AnyNode | null {
  const options = {
    ecmaVersion: 'latest' as const,
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowHashBang: true,
  }
  try {
    return parse(code, { ...options, sourceType: 'script' }) as unknown as AnyNode
  } catch {
    try {
      return parse(code, { ...options, sourceType: 'module' }) as unknown as AnyNode
    } catch {
      return null
    }
  }
}

/**
 * Merged HTML seeds put the learner's script inside `<script>`; tests that
 * analyze it statically still pass the whole document, so fall back to the
 * embedded script bodies when the raw source does not parse as JavaScript.
 */
function extractScriptBodies(html: string): string {
  const parts: string[] = []
  const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    if (match[1].includes('codekwes-sandbox')) continue
    if (match[1].trim()) parts.push(match[1])
  }
  return parts.join('\n;\n')
}

function firstDeclaration(node: AnyNode): AnyNode | null {
  const declarations = node.declarations as AnyNode[] | undefined
  return (declarations && declarations[0]) ?? null
}

function firstDeclInit(node: AnyNode): AnyNode | null {
  const declaration = firstDeclaration(node)
  return (declaration?.init as AnyNode | null | undefined) ?? null
}

function isFunctionNode(node: AnyNode): boolean {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression'
}

function createTree(code: string, context: ParseContext): { tree: AnyNode; source: string } | null {
  if (!code.trim()) return null
  if (context === 'expression') {
    const wrapped = 'const __explorer__ = (' + code + '\n);'
    const program = parseProgram(wrapped)
    const statement = program ? (program.body as AnyNode[])[0] : null
    const node = statement ? firstDeclInit(statement) : null
    return node ? { tree: node, source: wrapped } : null
  }
  if (context === 'parameter') {
    const wrapped = 'function __explorer__(' + code + '\n) {}'
    const program = parseProgram(wrapped)
    const fn = program ? (program.body as AnyNode[])[0] : null
    const param = fn ? ((fn.params as AnyNode[]) ?? [])[0] : null
    return param ? { tree: param, source: wrapped } : null
  }
  const direct = parseProgram(code)
  if (direct) return { tree: direct, source: code }
  if (/<script/i.test(code)) {
    const scripts = extractScriptBodies(code)
    const tree = scripts ? parseProgram(scripts) : null
    if (tree) return { tree, source: scripts }
  }
  return null
}

// ---------------------------------------------------------------------------
// Structural equivalence (FCC's areNodesEquivalent equivalent)
// ---------------------------------------------------------------------------

function unwrapSingleStatement(node: AnyNode): AnyNode {
  if (node.type === 'Program') {
    const body = node.body as AnyNode[]
    if (body.length === 1) return unwrapSingleStatement(body[0])
  }
  return node
}

function areLiteralsEquivalent(a: AnyNode, b: AnyNode): boolean {
  const aRegex = a.regex as { pattern: string; flags: string } | undefined
  const bRegex = b.regex as { pattern: string; flags: string } | undefined
  if (aRegex || bRegex) {
    return Boolean(aRegex && bRegex && aRegex.pattern === bRegex.pattern && aRegex.flags === bRegex.flags)
  }
  const aValue = a.value
  const bValue = b.value
  if (typeof aValue === 'bigint' || typeof bValue === 'bigint') {
    return typeof aValue === typeof bValue && String(aValue) === String(bValue)
  }
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return aValue === bValue || (Number.isNaN(aValue) && Number.isNaN(bValue))
  }
  return aValue === bValue && typeof aValue === typeof bValue
}

function areValuesEquivalent(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    for (let index = 0; index < a.length; index += 1) {
      if (!areValuesEquivalent(a[index], b[index])) return false
    }
    return true
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aNode = a as AnyNode
    const bNode = b as AnyNode
    if (typeof aNode.type === 'string' || typeof bNode.type === 'string') {
      return areNodesEquivalent(aNode, bNode)
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      if (IGNORED_KEYS.has(key)) continue
      if (!areValuesEquivalent((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false
      }
    }
    return true
  }
  return false
}

function areNodesEquivalent(a: AnyNode | null, b: AnyNode | null): boolean {
  if (a === null || b === null) return a === b
  const left = unwrapSingleStatement(a)
  const right = unwrapSingleStatement(b)
  if (left.type !== right.type) return false
  if (left.type === 'Literal' || left.type === 'BigIntLiteral') {
    return areLiteralsEquivalent(left, right)
  }
  if (left.type === 'TemplateElement') {
    const leftValue = left.value as { raw?: string; cooked?: string } | undefined
    const rightValue = right.value as { raw?: string; cooked?: string } | undefined
    return (leftValue?.cooked ?? leftValue?.raw) === (rightValue?.cooked ?? rightValue?.raw)
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if (IGNORED_KEYS.has(key)) continue
    if (!areValuesEquivalent(left[key], right[key])) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Explorer
// ---------------------------------------------------------------------------

function findStatements(node: AnyNode): AnyNode[] {
  switch (node.type) {
    case 'Program':
    case 'BlockStatement':
    case 'StaticBlock':
      return (node.body as AnyNode[]) ?? []
    case 'SwitchCase':
      return (node.consequent as AnyNode[]) ?? []
    default:
      return []
  }
}

/** The scope of a node: a function body or the node itself. */
function getBody(node: AnyNode): AnyNode | null {
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    return (node.body as AnyNode) ?? null
  }
  if (node.type === 'VariableDeclaration') {
    const init = firstDeclInit(node)
    if (init && isFunctionNode(init)) return (init.body as AnyNode) ?? null
  }
  return null
}

export class LessonExplorer {
  private tree: AnyNode | null
  private context: ParseContext
  private source: string

  constructor(code = '', context: ParseContext = 'source') {
    this.context = context
    this.source = code
    const parsed = createTree(code, context)
    this.tree = parsed ? parsed.tree : null
    if (parsed) this.source = parsed.source
  }

  private child(node: AnyNode | null): LessonExplorer {
    const explorer = new LessonExplorer()
    explorer.tree = node
    explorer.context = node ? inferContext(node) : 'source'
    explorer.source = this.source
    return explorer
  }

  isEmpty(): boolean {
    return this.tree === null
  }

  toString(): string {
    if (!this.tree) return 'no ast'
    return this.source.slice(this.tree.start, this.tree.end)
  }

  /** All direct scope statements of the given ESTree node type. */
  getAll(type: string): LessonExplorer[] {
    return this.scopeStatements()
      .filter((node) => node.type === type)
      .map((node) => this.child(node))
  }

  /** Raw statements of the node's scope (function body or the node itself). */
  private scopeStatements(): AnyNode[] {
    if (!this.tree) return []
    const body = getBody(this.tree)
    return findStatements(body ?? this.tree)
  }

  /** Compares this node with another source string or Explorer. */
  matches(other: string | LessonExplorer): boolean {
    if (typeof other === 'string') {
      if (!this.tree && !other.trim()) return true
      if (!this.tree) return false
      const parsed = createTree(other, this.context)
      return areNodesEquivalent(this.tree, parsed ? parsed.tree : null)
    }
    return areNodesEquivalent(this.tree, other.tree)
  }

  /** All variable declarations in the current scope, keyed by name. */
  get variables(): Record<string, LessonExplorer> {
    const result: Record<string, LessonExplorer> = {}
    for (const node of this.scopeStatements()) {
      if (node.type !== 'VariableDeclaration') continue
      const name = nodeIdentifierName(firstDeclaration(node))
      if (name) result[name] = this.child(node)
    }
    return result
  }

  /** The assigned value of a variable, property or default parameter. */
  get value(): LessonExplorer {
    if (!this.tree) return this.child(null)
    const node = this.tree
    if (node.type === 'VariableDeclaration') {
      const init = firstDeclInit(node)
      return init ? this.child(init) : this.child(null)
    }
    if (node.type === 'Property') {
      const propertyValue = node.value as AnyNode | null
      return propertyValue ? this.child(propertyValue) : this.child(null)
    }
    if (node.type === 'PropertyDefinition' || node.type === 'AssignmentPattern') {
      const assigned = (node.value ?? node.right) as AnyNode | null
      return assigned ? this.child(assigned) : this.child(null)
    }
    return this.child(null)
  }

  /** All function declarations in the current scope, keyed by name. */
  get functions(): Record<string, LessonExplorer> {
    const result: Record<string, LessonExplorer> = {}
    for (const node of this.scopeStatements()) {
      if (node.type !== 'FunctionDeclaration') continue
      const name = nodeIdentifierName(node)
      if (name) result[name] = this.child(node)
    }
    return result
  }

  /** Function declarations plus arrow/function expressions assigned to variables. */
  get allFunctions(): Record<string, LessonExplorer> {
    const result = { ...this.functions }
    for (const node of this.scopeStatements()) {
      if (node.type !== 'VariableDeclaration') continue
      const init = firstDeclInit(node)
      if (!init || !isFunctionNode(init)) continue
      const name = nodeIdentifierName(firstDeclaration(node))
      if (name) result[name] = this.child(node)
    }
    return result
  }

  /** Parameters of a function declaration, method-ish variable or function expression. */
  get parameters(): LessonExplorer[] {
    if (!this.tree) return []
    const node = this.tree
    if (node.type === 'FunctionDeclaration') {
      return ((node.params as AnyNode[]) ?? []).map((param) => this.child(param))
    }
    if (node.type === 'VariableDeclaration') {
      const init = firstDeclInit(node)
      if (init && isFunctionNode(init)) {
        return ((init.params as AnyNode[]) ?? []).map((param) => this.child(param))
      }
      return []
    }
    if (isFunctionNode(node)) {
      return ((node.params as AnyNode[]) ?? []).map((param) => this.child(param))
    }
    return []
  }

  /** Property assignments of an object literal, keyed by property name. */
  get objectProps(): Record<string, LessonExplorer> {
    if (!this.tree) return {}
    let objectNode: AnyNode | null = null
    if (this.tree.type === 'ObjectExpression') objectNode = this.tree
    if (this.tree.type === 'VariableDeclaration') {
      const init = firstDeclInit(this.tree)
      if (init && init.type === 'ObjectExpression') objectNode = init
    }
    if (!objectNode) return {}
    const result: Record<string, LessonExplorer> = {}
    for (const property of (objectNode.properties as AnyNode[]) ?? []) {
      if (property.type !== 'Property' || property.computed === true) continue
      const key = property.key as AnyNode | undefined
      if (key && key.type === 'Identifier' && typeof key.name === 'string') {
        result[key.name] = this.child(property)
      }
    }
    return result
  }

  /** Checks the outer `return` value of a function against an expression. */
  hasReturn(value: string): boolean {
    if (!this.tree) return false
    const body = getBody(this.tree)
    if (!body) return false
    if (body.type === 'BlockStatement' || body.type === 'StaticBlock') {
      for (const statement of (body.body as AnyNode[]) ?? []) {
        if (statement.type === 'ReturnStatement' && statement.argument) {
          return this.child(statement.argument as AnyNode).matches(value)
        }
      }
      return false
    }
    return this.child(body).matches(value)
  }
}

function nodeIdentifierName(node: AnyNode | null | undefined): string | null {
  const id = node?.id as AnyNode | null | undefined
  if (id && id.type === 'Identifier' && typeof id.name === 'string') return id.name
  return null
}

/**
 * Same async factory as FCC's `__helpers.Explorer(code)`.
 */
export const openExplorer = async (code: string): Promise<LessonExplorer> => new LessonExplorer(code)
