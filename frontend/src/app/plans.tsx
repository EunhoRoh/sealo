import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PlanSummary,
  useAddItem,
  useCreatePlan,
  useDeletePlan,
  usePlanDetail,
  usePlans,
  useToggleItem,
} from '@/api/plans';
import { DateField } from '@/components/picker-fields';
import { StampSplash } from '@/components/stamp-splash';
import {
  SealoBorder,
  SealoColors,
  SealoRadius,
  SealoShadow,
  SealoSpacing,
  SealoType,
} from '@/constants/sealo-theme';
import { PLAN_TEMPLATES, PlanTemplate, templateFor } from '@/constants/plan-templates';
import { notify } from '@/utils/notify';

function dday(targetDate: string | null): string | null {
  if (!targetDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate + 'T00:00:00');
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

export default function PlansScreen() {
  const { data: plans, isLoading } = usePlans();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>플랜</Text>
        <Pressable onPress={() => setShowCreate(true)} hitSlop={8} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ 새 플랜</Text>
        </Pressable>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={styles.emptyText}>
                여행, 운동, 공부… 뭐든 계획해봐!{'\n'}물범이 준비물부터 챙겨줄게 🦭
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <PlanCard plan={item} onPress={() => setDetailId(item.id)} />}
      />

      <PlanDetailModal planId={detailId} onClose={() => setDetailId(null)} />
      <CreatePlanModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  );
}

function PlanCard({ plan, onPress }: { plan: PlanSummary; onPress: () => void }) {
  const progress = plan.totalItems > 0 ? plan.doneItems / plan.totalItems : 0;
  const complete = plan.totalItems > 0 && plan.doneItems === plan.totalItems;
  const ddayLabel = dday(plan.targetDate);

  return (
    <Pressable onPress={onPress} style={[styles.card, complete && styles.cardComplete]}>
      <Text style={styles.cardIcon}>{plan.icon}</Text>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {plan.title}
          </Text>
          {ddayLabel != null && (
            <View style={[styles.ddayBadge, ddayLabel === 'D-DAY' && styles.ddayToday]}>
              <Text style={[styles.ddayText, ddayLabel === 'D-DAY' && styles.ddayTodayText]}>
                {ddayLabel}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.cardCount}>
          {plan.doneItems}/{plan.totalItems} {complete ? '· 완료! 🦭' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function PlanDetailModal({ planId, onClose }: { planId: number | null; onClose: () => void }) {
  const { data: plan } = usePlanDetail(planId);
  const toggle = useToggleItem();
  const addItem = useAddItem();
  const deletePlan = useDeletePlan();
  const [newItem, setNewItem] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  const onToggle = (itemId: number) => {
    if (toggle.isPending) return;
    toggle.mutate(itemId, {
      onSuccess: (result) => {
        if (result.bonusShells > 0) {
          setCelebrate(true);
          notify(`플랜 완주! 🐚 +${result.bonusShells} 조개를 받았어요`);
        }
      },
    });
  };

  const onAdd = () => {
    const name = newItem.trim();
    if (!name || planId == null || addItem.isPending) return;
    addItem.mutate({ planId, name }, { onSuccess: () => setNewItem('') });
  };

  const onDelete = () => {
    if (planId == null || deletePlan.isPending) return;
    deletePlan.mutate(planId, { onSuccess: onClose });
  };

  return (
    <Modal visible={planId != null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          {plan && (
            <>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>
                  {plan.icon} {plan.title}
                </Text>
                {dday(plan.targetDate) != null && (
                  <Text style={styles.detailDday}>{dday(plan.targetDate)}</Text>
                )}
              </View>
              <Text style={styles.sealComment}>{templateFor(plan.theme).sealComment}</Text>

              <ScrollView style={styles.itemList}>
                {plan.items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onToggle(item.id)}
                    style={styles.itemRow}>
                    <Text style={styles.itemCheck}>{item.done ? '🦭' : '⬜'}</Text>
                    <Text style={[styles.itemName, item.done && styles.itemNameDone]}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="항목 추가"
                  value={newItem}
                  onChangeText={setNewItem}
                  onSubmitEditing={onAdd}
                  maxLength={50}
                />
                <Pressable onPress={onAdd} style={styles.addItemButton}>
                  <Text style={styles.addItemButtonText}>추가</Text>
                </Pressable>
              </View>

              <View style={styles.detailFooter}>
                <Pressable onPress={onDelete} hitSlop={8}>
                  <Text style={styles.deleteText}>플랜 삭제</Text>
                </Pressable>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Text style={styles.closeText}>닫기</Text>
                </Pressable>
              </View>
            </>
          )}
          <StampSplash visible={celebrate} onDone={() => setCelebrate(false)} />
        </View>
      </View>
    </Modal>
  );
}

function CreatePlanModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const create = useCreatePlan();
  const [template, setTemplate] = useState<PlanTemplate>(PLAN_TEMPLATES[0]);
  const [title, setTitle] = useState(PLAN_TEMPLATES[0].defaultTitle);
  const [targetDate, setTargetDate] = useState('');
  const [items, setItems] = useState<string[]>(PLAN_TEMPLATES[0].items);

  const pickTemplate = (t: PlanTemplate) => {
    setTemplate(t);
    setTitle(t.defaultTitle);
    setItems(t.items);
  };

  const dateValid = targetDate === '' || /^\d{4}-\d{2}-\d{2}$/.test(targetDate);
  const valid = title.trim().length > 0 && dateValid;

  const onSave = () => {
    if (!valid || create.isPending) return;
    create.mutate(
      {
        title: title.trim(),
        theme: template.theme,
        icon: template.icon,
        targetDate: template.usesTargetDate && targetDate !== '' ? targetDate : undefined,
        items: items.filter((name) => name.trim().length > 0),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.detailTitle}>새 플랜</Text>

          <View style={styles.templateRow}>
            {PLAN_TEMPLATES.map((t) => (
              <Pressable
                key={t.theme}
                onPress={() => pickTemplate(t)}
                style={[styles.templateChip, template.theme === t.theme && styles.templateChipOn]}>
                <Text style={styles.templateChipIcon}>{t.icon}</Text>
                <Text
                  style={[
                    styles.templateChipLabel,
                    template.theme === t.theme && styles.templateChipLabelOn,
                  ]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.addInput}
            placeholder="플랜 이름 (예: 제주 여행)"
            value={title}
            onChangeText={setTitle}
            maxLength={30}
          />
          {template.usesTargetDate && (
            <DateField value={targetDate} onChange={setTargetDate} placeholder="목표일 (선택)" />
          )}

          <Text style={styles.templateHint}>
            {template.items.length > 0
              ? `물범이 ${items.length}개 항목을 미리 챙겨놨어요 — 저장 후 수정 가능`
              : '저장 후 항목을 추가해보세요'}
          </Text>

          <View style={styles.modalButtons}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text>취소</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              style={[styles.saveButton, !valid && styles.saveButtonDisabled]}>
              <Text style={styles.saveButtonText}>만들기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SealoColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SealoSpacing.sm,
  },
  title: { ...SealoType.title },
  addButton: { position: 'absolute', right: SealoSpacing.lg },
  addButtonText: { fontWeight: '700', color: SealoColors.stampRed, fontSize: 15 },
  listContent: { padding: SealoSpacing.lg, gap: SealoSpacing.sm },
  empty: { alignItems: 'center', marginTop: SealoSpacing.xl, gap: SealoSpacing.md },
  emptyEmoji: { fontSize: 44 },
  emptyText: { textAlign: 'center', color: SealoColors.textSecondary, lineHeight: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SealoSpacing.md,
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.md,
    backgroundColor: SealoColors.surface,
    padding: SealoSpacing.md,
    ...SealoShadow,
  },
  cardComplete: { borderColor: SealoColors.stampRed },
  cardIcon: { fontSize: 28 },
  cardBody: { flex: 1, gap: 5 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SealoSpacing.sm },
  cardTitle: { ...SealoType.body, flexShrink: 1 },
  ddayBadge: {
    backgroundColor: SealoColors.ice,
    borderRadius: SealoRadius.lg,
    paddingHorizontal: SealoSpacing.sm,
    paddingVertical: 2,
  },
  ddayToday: { backgroundColor: SealoColors.stampRed },
  ddayText: { fontSize: 11, fontWeight: '800', color: SealoColors.ink },
  ddayTodayText: { color: SealoColors.surface },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: SealoColors.ice,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: SealoColors.stampRed, borderRadius: 4 },
  cardCount: { ...SealoType.caption, color: SealoColors.textSecondary },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: SealoColors.backdrop },
  modalSheet: {
    backgroundColor: SealoColors.surface,
    borderTopLeftRadius: SealoRadius.lg,
    borderTopRightRadius: SealoRadius.lg,
    padding: SealoSpacing.lg,
    gap: SealoSpacing.md,
    maxHeight: '85%',
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: SealoSpacing.sm },
  detailTitle: { ...SealoType.section, flexShrink: 1 },
  detailDday: { fontWeight: '800', color: SealoColors.stampRed },
  sealComment: { ...SealoType.caption, color: SealoColors.textSecondary, fontSize: 13 },
  itemList: { maxHeight: 320 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SealoSpacing.md,
    paddingVertical: 10,
  },
  itemCheck: { fontSize: 18 },
  itemName: { fontSize: 15, color: SealoColors.textPrimary, flex: 1 },
  itemNameDone: { textDecorationLine: 'line-through', color: SealoColors.disabled },
  addRow: { flexDirection: 'row', gap: SealoSpacing.sm },
  addInput: {
    flexGrow: 1,
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    paddingHorizontal: SealoSpacing.md,
    paddingVertical: 10,
    fontSize: 15,
  },
  addItemButton: {
    backgroundColor: SealoColors.ink,
    borderRadius: SealoRadius.sm,
    paddingHorizontal: SealoSpacing.lg,
    justifyContent: 'center',
  },
  addItemButtonText: { color: SealoColors.surface, fontWeight: '700' },
  detailFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  deleteText: { color: SealoColors.stampRed, fontWeight: '600' },
  closeText: { color: SealoColors.textSecondary, fontWeight: '600' },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SealoSpacing.sm },
  templateChip: {
    alignItems: 'center',
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    paddingHorizontal: SealoSpacing.md,
    paddingVertical: SealoSpacing.sm,
    gap: 2,
  },
  templateChipOn: { backgroundColor: SealoColors.ink },
  templateChipIcon: { fontSize: 18 },
  templateChipLabel: { fontSize: 12, fontWeight: '600', color: SealoColors.ink },
  templateChipLabelOn: { color: SealoColors.surface },
  templateHint: { ...SealoType.caption, color: SealoColors.textSecondary },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: SealoSpacing.lg },
  cancelButton: { paddingVertical: 10, paddingHorizontal: SealoSpacing.md },
  saveButton: {
    backgroundColor: SealoColors.ink,
    borderRadius: SealoRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: SealoSpacing.lg,
  },
  saveButtonDisabled: { opacity: 0.3 },
  saveButtonText: { color: SealoColors.surface, fontWeight: '700' },
});
