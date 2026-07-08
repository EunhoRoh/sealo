import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AI_PLAN_COST_SHELLS, useGenerateAiPlan } from '@/api/ai';
import { useMe } from '@/api/shop';
import { DateField } from '@/components/picker-fields';
import { SealCharacter } from '@/components/seal-character';
import {
  AI_PLAN_SPECS,
  AiPlanSpec,
  AiQuestion,
} from '@/constants/ai-questions';
import {
  SealoBorder,
  SealoColors,
  SealoRadius,
  SealoSpacing,
  SealoType,
} from '@/constants/sealo-theme';
import { notify } from '@/utils/notify';

/**
 * "물범에게 부탁하기" 위저드 (docs/14) — 듀오링고 원칙:
 * 한 화면에 한 질문, 칩 우선(타이핑 최소화), 즉각 피드백, 캐릭터가 진행을 이끈다.
 * 질문 스키마는 constants/ai-questions.ts (데이터 기반 — 질문 수정에 이 파일 무수정)
 */
interface Props {
  visible: boolean;
  onClose: () => void;
  /** 생성된 플랜 상세를 바로 열기 위한 콜백 */
  onCreated: (planId: number) => void;
}

type Phase = 'pick' | 'questions' | 'working';

export function AiPlanModal({ visible, onClose, onCreated }: Props) {
  const generate = useGenerateAiPlan();
  const { data: me } = useMe();

  const [phase, setPhase] = useState<Phase>('pick');
  const [spec, setSpec] = useState<AiPlanSpec | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setPhase('pick');
      setSpec(null);
      setStep(0);
      setAnswers({});
    }
  }, [visible]);

  const firstFree = me?.aiPlanUses === 0;
  const question: AiQuestion | null = spec ? (spec.questions[step] ?? null) : null;
  const answer = question ? (answers[question.key] ?? '') : '';
  const canNext = question ? question.optional === true || answer.trim() !== '' : false;

  const setAnswer = (value: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
  };

  const toggleMulti = (option: string) => {
    const selected = answer === '' ? [] : answer.split(',');
    const next = selected.includes(option)
      ? selected.filter((v) => v !== option)
      : [...selected, option];
    setAnswer(next.join(','));
  };

  const goNext = () => {
    if (!spec) return;
    if (step + 1 < spec.questions.length) {
      setStep(step + 1);
      return;
    }
    // 마지막 질문 → 물범 출동
    setPhase('working');
    const startedAt = Date.now();
    generate.mutate(
      { type: spec.type, answers },
      {
        onSuccess: (result) => {
          // 마법의 순간을 위해 최소 1.5초는 뒤뚱거린다
          const wait = Math.max(0, 1500 - (Date.now() - startedAt));
          setTimeout(() => {
            if (result.paidShells > 0) notify(`🐚 조개 ${result.paidShells}개를 사용했어요`);
            onCreated(result.plan.id);
            onClose();
          }, wait);
        },
        onError: (error) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          notify(
            status === 409
              ? `조개가 부족해요! AI 플랜은 🐚 ${AI_PLAN_COST_SHELLS}개가 필요해요 (루틴으로 모아보자)`
              : '물범이 길을 잃었어요… 잠시 후 다시 부탁해줘요',
          );
          setPhase('questions');
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {phase === 'pick' && (
            <>
              <Text style={styles.title}>물범에게 부탁하기 ✨</Text>
              <Text style={styles.subtitle}>
                {firstFree
                  ? '첫 부탁은 무료야! 뭘 계획해줄까?'
                  : `한 번 부탁에 🐚 ${AI_PLAN_COST_SHELLS}개 (보유: ${me?.shellBalance ?? 0})`}
              </Text>
              <View style={styles.specGrid}>
                {AI_PLAN_SPECS.map((s) => (
                  <Pressable
                    key={s.type}
                    style={styles.specCard}
                    onPress={() => {
                      setSpec(s);
                      setStep(0);
                      setPhase('questions');
                    }}>
                    <Text style={styles.specIcon}>{s.icon}</Text>
                    <Text style={styles.specLabel}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
                <Text style={styles.closeText}>닫기</Text>
              </Pressable>
            </>
          )}

          {phase === 'questions' && spec && question && (
            <>
              <View style={styles.progressRow}>
                {spec.questions.map((_, i) => (
                  <View key={i} style={[styles.progressDot, i <= step && styles.progressDotOn]} />
                ))}
              </View>
              <SealCharacter size="sm" message={step === 0 ? spec.intro : undefined} />
              <Text style={styles.question}>{question.title}</Text>

              {question.type === 'text' && (
                <TextInput
                  style={styles.input}
                  placeholder={question.placeholder}
                  value={answer}
                  onChangeText={setAnswer}
                  maxLength={30}
                  autoFocus
                />
              )}
              {question.type === 'date' && <DateField value={answer} onChange={setAnswer} />}
              {(question.type === 'chips' || question.type === 'multi') && (
                <View style={styles.chipWrap}>
                  {question.options?.map((option) => {
                    const on =
                      question.type === 'multi'
                        ? answer.split(',').includes(option)
                        : answer === option;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() =>
                          question.type === 'multi' ? toggleMulti(option) : setAnswer(option)
                        }>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <View style={styles.footer}>
                <Pressable
                  onPress={() => (step === 0 ? setPhase('pick') : setStep(step - 1))}
                  hitSlop={8}>
                  <Text style={styles.backText}>← 이전</Text>
                </Pressable>
                <Pressable
                  onPress={goNext}
                  style={[styles.nextButton, !canNext && styles.nextButtonDisabled]}
                  disabled={!canNext}>
                  <Text style={styles.nextButtonText}>
                    {step + 1 === spec.questions.length ? '🦭 부탁하기' : '다음'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {phase === 'working' && spec && (
            <View style={styles.working}>
              <SealCharacter message={`${spec.label} 계획 짜는 중… 뒤뚱뒤뚱`} />
              <ActivityIndicator color={SealoColors.stampRed} />
              <Text style={styles.workingHint}>물범이 계획서를 물고 오고 있어요</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: SealoColors.backdrop },
  sheet: {
    backgroundColor: SealoColors.surface,
    borderTopLeftRadius: SealoRadius.lg,
    borderTopRightRadius: SealoRadius.lg,
    padding: SealoSpacing.lg,
    gap: SealoSpacing.md,
    minHeight: 380,
  },
  title: { ...SealoType.section, textAlign: 'center' },
  subtitle: { textAlign: 'center', color: SealoColors.textSecondary, fontSize: 13 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SealoSpacing.sm, justifyContent: 'center' },
  specCard: {
    width: '30%',
    alignItems: 'center',
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.md,
    paddingVertical: SealoSpacing.md,
    gap: 4,
  },
  specIcon: { fontSize: 26 },
  specLabel: { fontSize: 13, fontWeight: '700', color: SealoColors.ink },
  closeButton: { alignSelf: 'center', padding: SealoSpacing.sm },
  closeText: { color: SealoColors.textSecondary },
  progressRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  progressDot: { width: 22, height: 5, borderRadius: 3, backgroundColor: SealoColors.ice },
  progressDotOn: { backgroundColor: SealoColors.stampRed },
  question: { ...SealoType.section, textAlign: 'center' },
  input: {
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    paddingHorizontal: SealoSpacing.md,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SealoSpacing.sm, justifyContent: 'center' },
  chip: {
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.lg,
    paddingHorizontal: SealoSpacing.lg,
    paddingVertical: SealoSpacing.sm,
  },
  chipOn: { backgroundColor: SealoColors.ink },
  chipText: { fontSize: 15, fontWeight: '600', color: SealoColors.ink },
  chipTextOn: { color: SealoColors.surface },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  backText: { color: SealoColors.textSecondary, fontWeight: '600' },
  nextButton: {
    backgroundColor: SealoColors.stampRed,
    borderRadius: SealoRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: SealoSpacing.xl,
  },
  nextButtonDisabled: { opacity: 0.3 },
  nextButtonText: { color: SealoColors.surface, fontWeight: '800', fontSize: 15 },
  working: { alignItems: 'center', gap: SealoSpacing.lg, paddingVertical: SealoSpacing.xl },
  workingHint: { color: SealoColors.textSecondary, fontSize: 13 },
});
