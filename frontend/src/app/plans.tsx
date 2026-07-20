import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PlanItem,
  PlanSummary,
  useAddItem,
  useCreatePlan,
  useDeletePlan,
  usePlanDetail,
  usePlans,
  useRescheduleItem,
  useShiftPlan,
  useToggleItem,
} from '@/api/plans';
import { AiPlanModal } from '@/components/ai-plan-modal';
import { DateField, TimeField } from '@/components/picker-fields';
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
  const [showAi, setShowAi] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>플랜</Text>
        <Pressable onPress={() => setShowCreate(true)} hitSlop={8} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ 새 플랜</Text>
        </Pressable>
      </View>

      <Pressable style={styles.aiHero} onPress={() => setShowAi(true)}>
        <Text style={styles.aiHeroIcon}>🦭</Text>
        <View style={styles.aiHeroBody}>
          <Text style={styles.aiHeroTitle}>물범에게 부탁하기 ✨</Text>
          <Text style={styles.aiHeroDesc}>여행·운동·식단·독서… 몇 번만 고르면 계획을 짜줘요</Text>
        </View>
      </Pressable>

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
      <AiPlanModal
        visible={showAi}
        onClose={() => setShowAi(false)}
        onCreated={(planId) => setDetailId(planId)}
      />
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
  const shift = useShiftPlan();
  const reschedule = useRescheduleItem();
  const [newItem, setNewItem] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  // 일정 편집 중인 항목 (길게 누르거나 날짜 뱃지 탭)
  const [editItem, setEditItem] = useState<PlanItem | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('09:00');

  const hasSchedule =
    plan != null && (plan.targetDate != null || plan.items.some((i) => i.scheduledDate != null));

  const openScheduleEditor = (item: PlanItem) => {
    setEditItem(item);
    setEditDate(item.scheduledDate ?? '');
    setEditTime(item.scheduledTime?.slice(0, 5) ?? '09:00');
  };

  const saveSchedule = () => {
    if (!editItem || reschedule.isPending) return;
    reschedule.mutate(
      { itemId: editItem.id, date: editDate !== '' ? editDate : null, time: editDate !== '' ? editTime : null },
      { onSuccess: () => setEditItem(null) },
    );
  };

  const clearSchedule = () => {
    if (!editItem || reschedule.isPending) return;
    reschedule.mutate(
      { itemId: editItem.id, date: null, time: null },
      { onSuccess: () => setEditItem(null) },
    );
  };

  const onShift = (days: number) => {
    if (planId == null || shift.isPending) return;
    shift.mutate({ planId, days });
  };

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
    <BottomSheet visible={planId != null} onClose={onClose}>
          {plan && (
            <>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle} numberOfLines={1}>
                  {plan.icon} {plan.title}
                </Text>
                {dday(plan.targetDate) != null && (
                  <Text style={styles.detailDday}>{dday(plan.targetDate)}</Text>
                )}
              </View>
              <Text style={styles.sealComment}>{templateFor(plan.theme).sealComment}</Text>

              {hasSchedule && (
                <View style={styles.shiftRow}>
                  <Pressable style={styles.shiftButton} onPress={() => onShift(1)}>
                    <Text style={styles.shiftText}>😅 하루 밀렸어 (+1일)</Text>
                  </Pressable>
                  <Pressable style={styles.shiftButton} onPress={() => onShift(-1)}>
                    <Text style={styles.shiftText}>⚡ 하루 당기기 (-1일)</Text>
                  </Pressable>
                </View>
              )}

              <ScrollView style={styles.itemList}>
                {plan.items.map((item) => (
                  <View key={item.id}>
                    <Pressable
                      onPress={() => onToggle(item.id)}
                      onLongPress={() => openScheduleEditor(item)}
                      delayLongPress={400}
                      style={styles.itemRow}>
                      <Text style={styles.itemCheck}>{item.done ? '🦭' : '⬜'}</Text>
                      <Text style={[styles.itemName, item.done && styles.itemNameDone]}>
                        {item.name}
                      </Text>
                      <Pressable onPress={() => openScheduleEditor(item)} hitSlop={6}>
                        <View style={[styles.itemDateBadge, item.scheduledDate == null && styles.itemDateEmpty]}>
                          <Text style={styles.itemDateText}>
                            {item.scheduledDate != null
                              ? `${item.scheduledDate.slice(5).replace('-', '/')}${
                                  item.scheduledTime != null ? ` ${item.scheduledTime.slice(0, 5)} 🔔` : ''
                                }`
                              : '🕐'}
                          </Text>
                        </View>
                      </Pressable>
                    </Pressable>

                    {editItem?.id === item.id && (
                      <View style={styles.scheduleEditor}>
                        <DateField value={editDate} onChange={setEditDate} placeholder="날짜 선택" />
                        {editDate !== '' && <TimeField value={editTime} onChange={setEditTime} />}
                        <View style={styles.scheduleEditorButtons}>
                          {item.scheduledDate != null && (
                            <Pressable onPress={clearSchedule} hitSlop={8}>
                              <Text style={styles.deleteText}>알람 해제</Text>
                            </Pressable>
                          )}
                          <Pressable onPress={() => setEditItem(null)} hitSlop={8}>
                            <Text style={styles.closeText}>취소</Text>
                          </Pressable>
                          <Pressable style={styles.scheduleSave} onPress={saveSchedule}>
                            <Text style={styles.scheduleSaveText}>저장</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
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
    </BottomSheet>
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
    <BottomSheet visible={visible} onClose={onClose}>
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
    </BottomSheet>
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
  aiHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SealoSpacing.md,
    marginHorizontal: SealoSpacing.lg,
    borderWidth: 2,
    borderColor: SealoColors.stampRed,
    borderRadius: SealoRadius.md,
    backgroundColor: SealoColors.todayHighlight,
    padding: SealoSpacing.md,
    ...SealoShadow,
  },
  aiHeroIcon: { fontSize: 30 },
  aiHeroBody: { flex: 1 },
  aiHeroTitle: { ...SealoType.body, color: SealoColors.ink },
  aiHeroDesc: { fontSize: 12, color: SealoColors.textSecondary, marginTop: 2 },
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
  itemDateBadge: {
    backgroundColor: SealoColors.ice,
    borderRadius: SealoRadius.lg,
    paddingHorizontal: SealoSpacing.sm,
    paddingVertical: 2,
  },
  itemDateText: { fontSize: 11, fontWeight: '700', color: SealoColors.ink },
  itemDateEmpty: { backgroundColor: 'transparent' },
  shiftRow: { flexDirection: 'row', gap: SealoSpacing.sm },
  shiftButton: {
    flex: 1,
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    paddingVertical: SealoSpacing.sm,
    alignItems: 'center',
  },
  shiftText: { fontSize: 13, fontWeight: '700', color: SealoColors.ink },
  scheduleEditor: {
    backgroundColor: SealoColors.ice,
    borderRadius: SealoRadius.sm,
    padding: SealoSpacing.md,
    gap: SealoSpacing.sm,
    marginBottom: SealoSpacing.sm,
  },
  scheduleEditorButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SealoSpacing.lg,
  },
  scheduleSave: {
    backgroundColor: SealoColors.ink,
    borderRadius: SealoRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: SealoSpacing.lg,
  },
  scheduleSaveText: { color: SealoColors.surface, fontWeight: '700' },
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
