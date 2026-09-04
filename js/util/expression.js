/**
 * expression
 *
 * A small recursive-descent parser/compiler for the dx/dt and dy/dt text
 * inputs. Replaces raw eval() on user input: expressions are parsed once
 * (when the input text changes) and compiled into a closure over x and y,
 * rather than being re-parsed as a JS string on every grid point of every
 * frame.
 *
 * @author contraflux
 * @date 10/8/2025
 */

const FUNCTIONS = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    pow: Math.pow,
    sqrt: Math.sqrt,
    log: Math.log,
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
};

const CONSTANTS = {
    pi: Math.PI,
    e: Math.E,
};

/**
 * Split an expression string into a list of tokens
 *
 * @param {string} input - The expression to tokenize
 * @returns {array} The list of tokens, ending with an 'eof' token
 */
function tokenize(input) {
    const tokens = [];
    let i = 0;

    while (i < input.length) {
        const c = input[i];

        if (/\s/.test(c)) {
            i++;
            continue;
        }

        if (/[0-9.]/.test(c)) {
            const start = i;
            while (i < input.length && /[0-9.]/.test(input[i])) i++;

            if (input[i] === 'e' || input[i] === 'E') {
                let j = i + 1;
                if (input[j] === '+' || input[j] === '-') j++;
                if (/[0-9]/.test(input[j])) {
                    i = j;
                    while (i < input.length && /[0-9]/.test(input[i])) i++;
                }
            }

            tokens.push({ type: 'num', value: parseFloat(input.slice(start, i)) });
            continue;
        }

        if (/[a-zA-Z_]/.test(c)) {
            const start = i;
            while (i < input.length && /[a-zA-Z_0-9]/.test(input[i])) i++;
            tokens.push({ type: 'ident', name: input.slice(start, i) });
            continue;
        }

        if (c === '*' && input[i + 1] === '*') {
            tokens.push({ type: '^' }); // ** is an alias for ^
            i += 2;
            continue;
        }

        if ('+-*/^(),'.includes(c)) {
            tokens.push({ type: c });
            i++;
            continue;
        }

        throw new Error(`Unexpected character '${c}' in expression`);
    }

    tokens.push({ type: 'eof' });
    return tokens;
}

/**
 * Parse a token list into an expression AST
 *
 * @param {array} tokens - The tokens produced by tokenize()
 * @returns {object} The root node of the expression AST
 */
function parseTokens(tokens) {
    let pos = 0;

    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function expect(type) {
        if (peek().type !== type) {
            throw new Error(`Expected '${type}' but found '${peek().type}'`);
        }
        return next();
    }

    function parseExpression() {
        let node = parseTerm();

        while (peek().type === '+' || peek().type === '-') {
            const op = next().type;
            node = { type: 'binary', op, left: node, right: parseTerm() };
        }

        return node;
    }

    function parseTerm() {
        let node = parseUnary();

        while (peek().type === '*' || peek().type === '/') {
            const op = next().type;
            node = { type: 'binary', op, left: node, right: parseUnary() };
        }

        return node;
    }

    function parseUnary() {
        if (peek().type === '-' || peek().type === '+') {
            const op = next().type;
            return { type: 'unary', op, arg: parseUnary() };
        }

        return parsePower();
    }

    function parsePower() {
        const base = parsePrimary();

        if (peek().type === '^') {
            next();
            return { type: 'binary', op: '^', left: base, right: parseUnary() };
        }

        return base;
    }

    function parsePrimary() {
        const token = peek();

        if (token.type === 'num') {
            next();
            return { type: 'num', value: token.value };
        }

        if (token.type === '(') {
            next();
            const node = parseExpression();
            expect(')');
            return node;
        }

        if (token.type === 'ident') {
            next();

            if (peek().type === '(') {
                next();
                const args = [parseExpression()];
                while (peek().type === ',') {
                    next();
                    args.push(parseExpression());
                }
                expect(')');
                return { type: 'call', name: token.name, args };
            }

            return { type: 'ident', name: token.name };
        }

        throw new Error(`Unexpected token '${token.type}' in expression`);
    }

    const ast = parseExpression();
    expect('eof');
    return ast;
}

/**
 * Compile an expression AST into a closure over x and y
 *
 * @param {object} node - An AST node produced by parseTokens()
 * @returns {function} A function (x, y) => number
 */
function compile(node) {
    switch (node.type) {
        case 'num': {
            const value = node.value;
            return () => value;
        }

        case 'ident': {
            if (node.name === 'x') return (x, y) => x;
            if (node.name === 'y') return (x, y) => y;

            if (node.name in CONSTANTS) {
                const value = CONSTANTS[node.name];
                return () => value;
            }

            throw new Error(`Unknown identifier '${node.name}'`);
        }

        case 'unary': {
            const arg = compile(node.arg);
            return node.op === '-' ? (x, y) => -arg(x, y) : arg;
        }

        case 'binary': {
            const left = compile(node.left);
            const right = compile(node.right);

            switch (node.op) {
                case '+': return (x, y) => left(x, y) + right(x, y);
                case '-': return (x, y) => left(x, y) - right(x, y);
                case '*': return (x, y) => left(x, y) * right(x, y);
                case '/': return (x, y) => left(x, y) / right(x, y);
                case '^': return (x, y) => Math.pow(left(x, y), right(x, y));
            }

            throw new Error(`Unknown operator '${node.op}'`);
        }

        case 'call': {
            const fn = FUNCTIONS[node.name];
            if (!fn) throw new Error(`Unknown function '${node.name}'`);

            const args = node.args.map(compile);
            if (args.length !== fn.length) {
                throw new Error(`'${node.name}' expects ${fn.length} argument(s), got ${args.length}`);
            }

            return (x, y) => fn(...args.map((arg) => arg(x, y)));
        }
    }

    throw new Error(`Unknown node type '${node.type}'`);
}

/**
 * Parse and compile an expression string into a fast closure over x and y
 *
 * @param {string} input - The expression to compile, e.g. "sin(x) - y^2"
 * @returns {function} A function (x, y) => number
 */
export function compileExpression(input) {
    return compile(parseTokens(tokenize(input)));
}
