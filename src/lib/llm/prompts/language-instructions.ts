/**
 * Language Instructions for LLM Prompts
 *
 * Provides language-specific instructions to append to prompts
 * to ensure AI output is in the correct language.
 */

export type PromptLanguage = 'en' | 'zh';

export const LANGUAGE_INSTRUCTIONS = {
  en: {
    outputLanguage: 'Output all text content in English.',
    culturalContext: 'Use examples relevant to global/Western markets.',
    keepTerms: 'Technical terms like MVTA, ROI, KPI, and SaaS should remain in English.',
  },
  zh: {
    outputLanguage: `请使用中文输出所有文本内容。这是强制要求。

重要翻译规则：
1. attack_name（攻击/漏洞名称）必须翻译成中文，例如：
   - "Scalability stress test" → "可扩展性压力测试"
   - "Supply chain poisoning" → "供应链污染"
   - "Usability failure" → "可用性失败"
   - "Systemic fragility" → "系统脆弱性"
   - "Entrenched competitors crushing entry" → "成熟竞争者碾压进入"
   - "Value proposition doubt" → "价值主张质疑"

2. 所有描述性词汇必须翻译，包括但不限于：
   - scalability → 可扩展性
   - fragility → 脆弱性
   - pivot → 战略转型
   - adverse selection → 逆向选择
   - cancel risk → 取消风险
   - unrecoverable → 不可恢复
   - vulnerable → 脆弱
   - weaponized → 武器化
   - proactive → 主动
   - cascading failure → 级联故障
   - apathy → 冷漠/疲劳
   - polarization → 极化
   - narrative warfare → 叙事战争
   - viability → 可行性
   - kill shot → 致命一击

3. 禁止中英文混杂的句子。每个字段的内容要么全中文，要么是专有缩略词。

4. 竞争对手分析翻译示例：
   - strengths/weaknesses 示例：
     * "Strong brand recognition" → "品牌认知度强"
     * "Limited market reach" → "市场覆盖有限"
     * "High customer retention" → "客户留存率高"
   - pricing 示例：
     * "Freemium model" → "免费增值模式"
     * "Enterprise pricing" → "企业定价"
     * "Per-seat licensing" → "按席位许可"

5. 社区反馈翻译示例：
   - themes 必须翻译：
     * "pricing" → "定价"
     * "usability" → "可用性"
     * "customer_support" → "客户支持"
     * "feature_request" → "功能需求"
     * "bug_report" → "缺陷反馈"
   - sentiment 保留英文键值（positive/negative/neutral）

6. 监管研究翻译示例：
   - applicability 地区名称翻译：
     * "US" → "美国"
     * "EU" → "欧盟"
     * "China" → "中国"
     * "Global" → "全球"`,
    culturalContext: '使用与中国市场相关的案例和背景。考虑中国特有的监管环境和商业模式。',
    keepTerms: '首字母缩略词应保留英文，如：MVTA、ROI、KPI、SaaS、NMPA、API、HIS、PACS、UI、IT、PR、CEO 等。其他描述性词汇必须翻译成中文。',
  },
} as const;

/**
 * Get language instruction block to append to system prompt
 *
 * @param language - The target output language
 * @returns A formatted string to append to the system prompt
 */
export function getLanguageInstruction(language: PromptLanguage): string {
  const instruction = LANGUAGE_INSTRUCTIONS[language];

  return `

## Language Requirements
${instruction.outputLanguage}
${instruction.keepTerms}
${instruction.culturalContext}
`;
}

/**
 * Default to English if language is not specified or invalid
 */
export function getValidPromptLanguage(lang: string | null | undefined): PromptLanguage {
  if (lang === 'zh') return 'zh';
  return 'en';
}
