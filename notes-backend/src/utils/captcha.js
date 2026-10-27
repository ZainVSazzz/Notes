import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SEGMENTS = {
  0: ['a', 'b', 'c', 'd', 'e', 'f'],
  1: ['b', 'c'],
  2: ['a', 'b', 'g', 'e', 'd'],
  3: ['a', 'b', 'g', 'c', 'd'],
  4: ['f', 'g', 'b', 'c'],
  5: ['a', 'f', 'g', 'c', 'd'],
  6: ['a', 'f', 'g', 'e', 'c', 'd'],
  7: ['a', 'b', 'c'],
  8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  9: ['a', 'b', 'c', 'd', 'f', 'g']
};

const SEGMENT_PATHS = {
  a: 'M8 6 L34 6',
  b: 'M36 8 L36 30',
  c: 'M36 38 L36 60',
  d: 'M8 62 L34 62',
  e: 'M6 38 L6 60',
  f: 'M6 8 L6 30',
  g: 'M8 34 L34 34'
};

function randomInt(min, max) {
  return crypto.randomInt(min, max + 1);
}

function shuffleArray(items) {
  return items
    .map((item) => ({
      item,
      sort: crypto.randomInt(1, 999999)
    }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function createOptionId() {
  return crypto.randomBytes(18).toString('hex');
}

function calculateAnswer(numberA, numberB, operator) {
  if (operator === '+') return numberA + numberB;
  if (operator === '-') return numberA - numberB;
  if (operator === '*') return numberA * numberB;

  return numberA + numberB;
}

function createMathQuestion() {
  const operators = ['+', '-', '*'];
  const operator = operators[randomInt(0, operators.length - 1)];

  let numberA = randomInt(2, 20);
  let numberB = randomInt(1, 12);

  if (operator === '-') {
    numberA = randomInt(10, 30);
    numberB = randomInt(1, numberA);
  }

  if (operator === '*') {
    numberA = randomInt(2, 9);
    numberB = randomInt(2, 9);
  }

  const answer = calculateAnswer(numberA, numberB, operator);

  return {
    numberA,
    numberB,
    operator,
    displayOperator: operator === '*' ? '×' : operator,
    answer
  };
}

function createAnswerOptions(correctAnswer) {
  const answerSet = new Set([correctAnswer]);

  while (answerSet.size < 4) {
    const offset = randomInt(-10, 10);

    if (offset === 0) {
      continue;
    }

    const wrongAnswer = correctAnswer + offset;

    if (wrongAnswer >= 0) {
      answerSet.add(wrongAnswer);
    }
  }

  const shuffledAnswers = shuffleArray([...answerSet]);

  return shuffledAnswers.map((answer) => ({
    optionId: createOptionId(),
    answer
  }));
}

function renderDigit(char, x) {
  const activeSegments = SEGMENTS[char];

  if (!activeSegments) {
    return '';
  }

  const rotate = randomInt(-3, 3);
  const translateY = randomInt(-2, 2);

  return `
    <g transform="translate(${x}, ${translateY}) rotate(${rotate} 22 34)">
      ${activeSegments
        .map((segment) => {
          return `
            <path
              d="${SEGMENT_PATHS[segment]}"
              fill="none"
              stroke="#111827"
              stroke-width="6"
              stroke-linecap="round"
            />
          `;
        })
        .join('')}
    </g>
  `;
}

function renderSymbol(char, x) {
  const rotate = randomInt(-4, 4);
  const translateY = randomInt(-2, 2);

  const base = `transform="translate(${x}, ${translateY}) rotate(${rotate} 22 34)"`;

  if (char === '+') {
    return `
      <g ${base}>
        <path d="M10 34 L34 34" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />
        <path d="M22 22 L22 46" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />
      </g>
    `;
  }

  if (char === '-') {
    return `
      <g ${base}>
        <path d="M10 34 L34 34" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />
      </g>
    `;
  }

  if (char === '×') {
    return `
      <g ${base}>
        <path d="M12 24 L32 44" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />
        <path d="M32 24 L12 44" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />
      </g>
    `;
  }

  if (char === '=') {
    return `
      <g ${base}>
        <path d="M10 29 L34 29" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" />
        <path d="M10 41 L34 41" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" />
      </g>
    `;
  }

  if (char === '?') {
    return `
      <g ${base}>
        <path d="M12 20 C14 10, 34 10, 34 24 C34 34, 22 34, 22 44" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />
        <path d="M22 58 L22 58" fill="none" stroke="#111827" stroke-width="8" stroke-linecap="round" />
      </g>
    `;
  }

  return '';
}

function renderNoise(width, height) {
  let noise = '';

  for (let i = 0; i < 10; i += 1) {
    const x1 = randomInt(0, width);
    const y1 = randomInt(0, height);
    const x2 = randomInt(0, width);
    const y2 = randomInt(0, height);

    noise += `
      <path
        d="M${x1} ${y1} L${x2} ${y2}"
        fill="none"
        stroke="#9ca3af"
        stroke-width="1"
        opacity="0.35"
      />
    `;
  }

  for (let i = 0; i < 18; i += 1) {
    const cx = randomInt(0, width);
    const cy = randomInt(0, height);
    const r = randomInt(1, 3);

    noise += `
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${r}"
        fill="#6b7280"
        opacity="0.25"
      />
    `;
  }

  return noise;
}

function renderTextAsSvg(text) {
  const chars = String(text).split('');
  const charWidth = 48;
  const height = 82;
  const width = chars.length * charWidth + 18;

  const glyphs = chars
    .map((char, index) => {
      const x = 12 + index * charWidth;

      if (/^\d$/.test(char)) {
        return renderDigit(char, x);
      }

      return renderSymbol(char, x);
    })
    .join('');

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      <rect width="100%" height="100%" rx="10" fill="#f9fafb" />
      ${renderNoise(width, height)}
      ${glyphs}
    </svg>
  `;
}

export function generateCaptcha() {
  const question = createMathQuestion();

  const questionText = `${question.numberA}${question.displayOperator}${question.numberB}=?`;

  const options = createAnswerOptions(question.answer);

  const correctOption = options.find((option) => {
    return option.answer === question.answer;
  });

  const token = jwt.sign(
    {
      purpose: 'math_captcha',
      correctOptionId: correctOption.optionId
    },
    process.env.CAPTCHA_SECRET,
    {
      expiresIn: process.env.CAPTCHA_EXPIRES_IN || '3m'
    }
  );

  return {
    token,
    questionSvg: renderTextAsSvg(questionText),
    options: options.map((option) => ({
      optionId: option.optionId,
      svg: renderTextAsSvg(option.answer)
    })),
    expiresIn: '15'
  };
}

export function verifyCaptchaToken(captchaToken, selectedOptionId) {
  if (!captchaToken || !selectedOptionId) {
    return false;
  }

  try {
    const decoded = jwt.verify(captchaToken, process.env.CAPTCHA_SECRET);

    if (decoded.purpose !== 'math_captcha') {
      return false;
    }

    return decoded.correctOptionId === selectedOptionId;
  } catch {
    return false;
  }
}