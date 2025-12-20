/**
 * i18n Constants
 *
 * Sample data and other language-specific constants.
 */

import type { Language } from './types';
import type { StructuredIdea } from '@/lib/validation/schemas';

/**
 * Sample ideas for each language
 * English: Idea validation platform
 * Chinese: AI medical imaging platform
 */
export const SAMPLE_IDEAS: Record<Language, StructuredIdea> = {
  en: {
    high_concept:
      'A platform that helps solo founders validate startup ideas through AI-powered adversarial analysis',
    value_proposition:
      'Founders spend weeks gathering feedback, only to realize critical flaws too late. We help solo founders and early-stage entrepreneurs identify risks before investing time and money.',
    success_metric_18m:
      '10,000 validated ideas with 70% accuracy on risk prediction',
    environment: {
      user_persona:
        'Solo founders and early-stage entrepreneurs (25-45 years old) who are technical enough to understand product development but lack market validation experience',
      competitive_landscape:
        'Similar tools: ProductHunt validation, BetaList feedback, Reddit communities. None combine automated research with adversarial analysis.',
      regulatory_context: '',
    },
    assumptions: {
      market: [
        'Solo founders spend 2 hours/day gathering feedback',
        'Founders are willing to pay $20/month for validation tools',
      ],
      technical: [
        'LLMs can accurately analyze startup ideas with proper prompting',
      ],
      business_model: [
        'SaaS subscription model works for validation tools',
        'Founders prefer self-service over consulting',
      ],
    },
    assets: {
      key_assets: [
        '10 years of experience in AI/ML',
        'Network of 500+ founders for beta testing',
      ],
      brand_narrative: [
        'Founded by Y Combinator alumni',
        'Previously built and sold a successful SaaS product',
      ],
    },
  },
  zh: {
    high_concept:
      '基于AI医疗影像分析的辅助诊断平台，帮助医生更快速、准确地识别早期病变',
    value_proposition:
      '医生每天需要查看大量医学影像，容易疲劳导致漏诊。我们帮助放射科医生和基层医疗机构在几秒内完成影像初筛，提高诊断效率和准确性。',
    success_metric_18m:
      '覆盖100家医院，辅助诊断准确率达到95%，日处理影像10万张',
    environment: {
      user_persona:
        '三甲医院放射科医生（30-50岁），每天需要阅读200+张影像，专业能力强但工作负担重',
      competitive_landscape:
        '竞争对手：推想科技、汇医慧影、深睿医疗。差异化：我们专注于基层医疗，价格更亲民，部署更灵活。',
      regulatory_context:
        '医疗器械三类注册证、NMPA审批、医疗AI相关法规',
    },
    assumptions: {
      market: [
        '基层医疗对AI辅助诊断有强烈需求',
        '医院愿意为提高效率付费',
      ],
      technical: [
        '现有模型准确率可达到临床应用标准',
        '可以实现快速部署和集成',
      ],
      business_model: [
        'SaaS订阅模式在医疗行业可行',
        '客单价可达到5万/年/医院',
      ],
    },
    assets: {
      key_assets: [
        '核心算法专利',
        '三甲医院合作关系',
        '医疗影像数据集',
      ],
      brand_narrative: [
        '专注于普惠医疗',
        '技术团队来自顶尖医学院',
      ],
    },
  },
};

/**
 * Get sample idea for a given language
 */
export function getSampleIdea(language: Language): StructuredIdea {
  return SAMPLE_IDEAS[language];
}

/**
 * Sample idea names for display in UI
 */
export const SAMPLE_IDEA_NAMES: Record<Language, string> = {
  en: 'Idea Validator',
  zh: 'AI医疗影像',
};

/**
 * Get display name for the sample idea
 */
export function getSampleIdeaName(language: Language): string {
  return SAMPLE_IDEA_NAMES[language];
}
