'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { StructuredIdeaSchema, Step1Schema, Step2Schema, Step3Schema, StructuredIdea } from '@/lib/validation/schemas';
import ProgressIndicator from './ProgressIndicator';
import FormNavigation from './FormNavigation';
import Step1CoreConcept from './Step1CoreConcept';
import Step2Environment from './Step2Environment';
import Step3AssumptionsAssets from './Step3AssumptionsAssets';

interface IntakeWizardProps {
  sessionId: string;
}

export default function IntakeWizard({ sessionId }: IntakeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMockMode = process.env.NEXT_PUBLIC_AUTH_MODE === 'mock';

  const form = useForm<StructuredIdea>({
    resolver: zodResolver(StructuredIdeaSchema),
    mode: 'onChange',
    defaultValues: {
      high_concept: '',
      value_proposition: '',
      success_metric_18m: '',
      assumptions: {
        market: [],
        technical: [],
        business_model: [],
      },
      assets: {
        key_assets: [],
        brand_narrative: [],
      },
      environment: {
        user_persona: '',
        competitive_landscape: '',
        regulatory_context: '',
      },
    },
  });

  const formData = form.watch();

  // Example data loaders
  const loadExample1 = () => {
    form.reset({
      high_concept: 'A platform that helps solo founders validate startup ideas through AI-powered adversarial analysis',
      value_proposition: 'Founders spend weeks gathering feedback, only to realize critical flaws too late. We help solo founders and early-stage entrepreneurs identify risks before investing time and money.',
      success_metric_18m: '10,000 validated ideas with 70% accuracy on risk prediction',
      environment: {
        user_persona: 'Solo founders and early-stage entrepreneurs (25-45 years old) who are technical enough to understand product development but lack market validation experience',
        competitive_landscape: 'Similar tools: ProductHunt validation, BetaList feedback, Reddit communities. None combine automated research with adversarial analysis.',
        regulatory_context: '',
      },
      assumptions: {
        market: [
          'Solo founders spend 2 hours/day gathering feedback',
          'Founders are willing to pay $20/month for validation tools'
        ],
        technical: [
          'LLMs can accurately analyze startup ideas with proper prompting'
        ],
        business_model: [
          'SaaS subscription model works for validation tools',
          'Founders prefer self-service over consulting'
        ],
      },
      assets: {
        key_assets: [
          '10 years of experience in AI/ML',
          'Network of 500+ founders for beta testing'
        ],
        brand_narrative: [
          'Founded by Y Combinator alumni',
          'Previously built and sold a successful SaaS product'
        ],
      },
    });
  };

  const loadExample2 = () => {
    form.reset({
      high_concept: 'AI-powered sales intelligence platform that auto-scores leads and predicts deal closure probability in real-time',
      value_proposition: 'Sales teams waste 60% of their time chasing low-quality leads and struggle to prioritize effectively. Our AI analyzes behavioral signals, company data, and historical patterns to surface the hottest opportunities, helping B2B sales teams close 40% more deals.',
      success_metric_18m: '500 paying companies, $3M ARR, 35% average increase in sales team quota attainment, 80% user adoption within sales orgs',
      environment: {
        user_persona: 'B2B sales teams (5-50 reps) at mid-market SaaS companies ($10M-$100M ARR), sales managers struggling with pipeline prioritization, revenue operations teams seeking data-driven insights',
        competitive_landscape: 'Competitors include Clari (forecast-focused, $4.7B valuation), Gong (conversation intelligence, expensive), 6sense (ABM focus, enterprise-only). Traditional CRMs like Salesforce/HubSpot lack predictive scoring. Our differentiation: affordable AI-native scoring for mid-market, real-time signals, seamless CRM integration.',
        regulatory_context: 'GDPR and CCPA compliance for contact data processing. SOC 2 Type II required for enterprise deals. Data processing agreements needed for EU customers. Email tracking subject to CAN-SPAM Act and GDPR consent requirements.',
      },
      assumptions: {
        market: [
          'Mid-market B2B sales teams willing to pay $99-$199 per sales rep per month',
          'Average deal size $50K-$500K with 3-9 month sales cycles',
          '60% of leads are currently unqualified or poorly prioritized',
          'Sales managers actively seek tools to improve team productivity'
        ],
        technical: [
          'AI can accurately predict deal closure with 75%+ accuracy using CRM data + engagement signals',
          'Real-time scoring latency under 2 seconds for lead updates',
          'Can integrate with Salesforce, HubSpot, Pipedrive APIs within 8 weeks',
          'Email tracking and web visitor identification achieve 80%+ match rates'
        ],
        business_model: [
          'Per-seat SaaS pricing ($99-$199/rep/month) sustainable with 25% churn',
          'Can achieve $100K ARR per sales hire within 12 months',
          'Free trial converts at 20%+ with proper product-led onboarding',
          'Upsell to enterprise plan ($299/rep) drives 40% revenue growth'
        ],
      },
      assets: {
        key_assets: [
          'CEO was VP Sales at $200M ARR SaaS company, deep network in sales tech community',
          'CTO built ML recommendation systems at LinkedIn for 6 years',
          'Proprietary dataset: 2M anonymized B2B sales interactions from 3 partner companies',
          'Early access agreement with Salesforce ISV partner program'
        ],
        brand_narrative: [
          'Backed by top sales tech investors (Stage 2 Capital, Blossom Capital)',
          'Featured in SaaStr Annual 2024 as "Top 10 Sales AI Startups to Watch"',
          'Advisory board includes former CROs from Stripe, Snowflake, and Atlassian'
        ],
      },
    });
  };

  const loadExample3 = () => {
    form.reset({
      high_concept: 'AI驱动的代码审查助手，专门针对JavaScript/TypeScript项目提供智能化安全和性能分析',
      value_proposition: '开发者在提交代码前很难发现潜在的安全漏洞、性能问题和代码异味。传统的静态分析工具误报率高，需要大量配置。我们的AI助手能够理解代码上下文，提供智能化的代码审查建议。',
      success_metric_18m: '1000个付费团队订阅，每个团队月活跃用户达到80%，代码审查时间减少50%，用户报告发现的关键bug数量提升3倍',
      environment: {
        user_persona: '中小型软件公司的前端/全栈开发者，团队规模5-50人，对代码质量有追求但缺乏专职代码审查人员',
        competitive_landscape: '现有工具包括SonarQube、ESLint、CodeClimate，但它们都是基于规则的静态分析，缺乏上下文理解能力。GitHub Copilot提供代码建议但不做深度审查。',
        regulatory_context: '',
      },
      assumptions: {
        market: [
          '中小团队愿意为AI代码审查付费$29/用户/月',
          '开发者每天花费30分钟在代码审查上',
          '团队平均规模10人，每月MRR潜力$290'
        ],
        technical: [
          'LLM能够准确理解代码上下文并给出有价值的建议',
          '可以在6个月内达到90%的安全漏洞检测准确率'
        ],
        business_model: [
          'SaaS订阅模式适用于开发工具市场',
          '14天免费试用可以实现25%的转化率',
          '能在6个月内达到产品-市场契合度'
        ],
      },
      assets: {
        key_assets: [
          '团队有10年的编译器和静态分析经验',
          '已有一个开源项目积累了5000+ GitHub stars',
          '与3家技术社区有合作关系'
        ],
        brand_narrative: [
          '创始团队来自某大厂编译器团队',
          '在开源社区有较高知名度和信誉'
        ],
      },
    });
  };

  const loadExample4 = () => {
    form.reset({
      high_concept: '智能医疗影像辅助诊断平台，专注于基层医院的早期肺癌筛查，30秒完成CT分析并提供风险分级',
      value_proposition: '基层医院和体检中心缺乏经验丰富的影像科医生，导致肺部CT扫描的漏诊率高达30%，患者错过最佳治疗窗口。我们的AI平台能够快速准确地检测肺结节，帮助基层医生提升诊断能力，挽救更多生命。',
      success_metric_18m: '覆盖500家基层医疗机构，月度阅片量100万份，早期肺癌检出率提升40%，获得NMPA三类医疗器械认证，年度ARR达到3000万元',
      environment: {
        user_persona: '二三线城市的二级医院影像科、民营体检中心，以及希望提升效率和质控的三甲医院影像科。覆盖年度肺癌高危筛查人群约5000万人。',
        competitive_landscape: '现有竞品包括汇医慧影、推想科技、深睿医疗等，但他们主要覆盖三甲医院。我们专注下沉市场，提供SaaS化轻量部署，无需昂贵硬件投入。已与30家基层医院建立合作，积累了20万份带标注的真实病例数据。',
        regulatory_context: '医疗AI属于第三类医疗器械，需要获得国家药品监督管理局(NMPA)认证。涉及《医疗器械监督管理条例》、数据安全法、个人信息保护法。患者数据需严格脱敏，用于科研需获得知情同意。',
      },
      assumptions: {
        market: [
          '分级诊疗政策推动下，基层医院有强烈的AI辅诊需求和付费意愿',
          '基层医院愿意按阅片量付费，0.5元/份的定价可接受',
          '年度肺癌高危筛查市场约5000万人次，基层医院占60%'
        ],
        technical: [
          '我们的算法在基层医院常见的老旧CT设备上也能保持高准确率（敏感度95%+）',
          '能够实现30秒内完成单次CT扫描的完整分析',
          '假阳性率可控制在15%以下，不会给医生造成过大负担'
        ],
        business_model: [
          '能在12个月内获得NMPA三类医疗器械认证，不会遇到重大政策障碍',
          '通过标杆客户案例可以快速复制到同类型医院',
          '专家远程会诊平台可带来20%的额外收入'
        ],
      },
      assets: {
        key_assets: [
          'CEO曾任某三甲医院影像科主任15年，深度了解临床需求',
          'CTO来自腾讯AI Lab，在医疗影像AI领域有丰富经验',
          '已与中国医学影像AI产学研联盟签订数据合作协议',
          '我们的模型在LUNA16国际肺结节检测竞赛中排名前5'
        ],
        brand_narrative: [
          '联合创始人在医疗器械流通领域有20年资源积累，渠道优势明显',
          '已与30家基层医院建立合作，积累了20万份带标注的真实病例数据'
        ],
      },
    });
  };

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        `idea-intake-draft-${sessionId}`,
        JSON.stringify(formData)
      );
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, sessionId]);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`idea-intake-draft-${sessionId}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }, [sessionId, form]);

  // Validate current step
  const validateStep = async (step: 1 | 2 | 3): Promise<boolean> => {
    let schema;
    let fields: (keyof StructuredIdea)[];

    switch (step) {
      case 1:
        schema = Step1Schema;
        fields = ['high_concept', 'value_proposition', 'success_metric_18m'];
        break;
      case 2:
        schema = Step2Schema;
        fields = ['environment'];
        break;
      case 3:
        schema = Step3Schema;
        fields = ['assumptions', 'assets'];
        break;
    }

    const result = await form.trigger(fields);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(3, prev + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      router.push('/dashboard');
    } else {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleReset = () => {
    form.reset({
      high_concept: '',
      value_proposition: '',
      success_metric_18m: '',
      assumptions: {
        market: [],
        technical: [],
        business_model: [],
      },
      assets: {
        key_assets: [],
        brand_narrative: [],
      },
      environment: {
        user_persona: '',
        competitive_landscape: '',
        regulatory_context: '',
      },
    });
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    // Validate entire form
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = form.getValues();

      const res = await fetch(`/api/sessions/${sessionId}/idea`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structured_idea: data,
          source: 'form',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit');
      }

      // Clear localStorage draft
      localStorage.removeItem(`idea-intake-draft-${sessionId}`);

      // Navigate to choice page
      router.push(`/analyze/${sessionId}/choice`);
    } catch (error) {
      console.error('Submit failed:', error);
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current step can proceed
  const canProceed = () => {
    const errors = form.formState.errors;

    switch (currentStep) {
      case 1:
        return (
          !errors.high_concept &&
          !errors.value_proposition &&
          !errors.success_metric_18m &&
          formData.high_concept?.length >= 10 &&
          formData.value_proposition?.length >= 20 &&
          formData.success_metric_18m?.length >= 10
        );
      case 2:
        return (
          !errors.environment?.user_persona &&
          !errors.environment?.competitive_landscape &&
          formData.environment?.user_persona?.length >= 20 &&
          formData.environment?.competitive_landscape?.length >= 20
        );
      case 3:
        // Step 3 is optional, always can proceed
        return true;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ProgressIndicator currentStep={currentStep} />

      {/* Example buttons - compact row */}
      {isMockMode ? (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-text-tertiary">Quick examples:</span>
          <button
            type="button"
            onClick={loadExample1}
            className="px-3 py-1 border border-border-medium text-text-secondary rounded hover:bg-bg-secondary hover:border-brand-primary transition-colors"
          >
            Idea Validator
          </button>
          <button
            type="button"
            onClick={loadExample2}
            className="px-3 py-1 border border-border-medium text-text-secondary rounded hover:bg-bg-secondary hover:border-brand-primary transition-colors"
          >
            Sales Analyzer
          </button>
          <button
            type="button"
            onClick={loadExample3}
            className="px-3 py-1 border border-border-medium text-text-secondary rounded hover:bg-bg-secondary hover:border-brand-primary transition-colors"
          >
            代码审查AI
          </button>
          <button
            type="button"
            onClick={loadExample4}
            className="px-3 py-1 border border-border-medium text-text-secondary rounded hover:bg-bg-secondary hover:border-brand-primary transition-colors"
          >
            医疗影像AI
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-brand-primary">No idea yet? Explore with a sample idea:</span>
          <button
            type="button"
            onClick={loadExample2}
            className="px-3 py-1.5 bg-border-light text-brand-primary rounded hover:bg-brand-light transition-colors"
          >
            AI Sales Analyzer
          </button>
        </div>
      )}

      <div className="bg-bg-primary rounded-lg shadow-card p-8">
        {currentStep === 1 && <Step1CoreConcept form={form} />}
        {currentStep === 2 && <Step2Environment form={form} />}
        {currentStep === 3 && <Step3AssumptionsAssets form={form} />}

        <FormNavigation
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isSubmitting={isSubmitting}
          canProceed={canProceed()}
        />
      </div>

      {/* Auto-save indicator */}
      <div className="mt-4 text-center text-xs text-text-tertiary">
        Your progress is automatically saved
      </div>
    </div>
  );
}
