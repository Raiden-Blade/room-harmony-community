import { expect, test } from "@playwright/test";

import { API_BASE_URL } from "./support";


test("AI PLAN Assist: profile → score → mocked suggestion → explicit apply → re-score", async ({ page, request }) => {
  const sessionId = `e2e-ai-plan-${Date.now()}`;
  const planResponse = await request.post(`${API_BASE_URL}/api/plans/from-coordinate/coord-001`, {
    headers: { "X-Session-ID": sessionId },
    data: { budget_max: 50_000 },
  });
  expect(planResponse.ok()).toBeTruthy();
  const plan = await planResponse.json();
  const fitResponse = await request.get(`${API_BASE_URL}/api/plans/${plan.id}/fit`, {
    headers: { "X-Session-ID": sessionId },
  });
  expect(fitResponse.ok()).toBeTruthy();
  const beforeFit = await fitResponse.json();
  const afterFit = {
    ...beforeFit,
    overall_score: Math.min(100, beforeFit.overall_score + 6),
    summary: `現在の適合度は${Math.min(100, beforeFit.overall_score + 6)}点です。`,
    fingerprint: "b".repeat(64),
  };
  const target = plan.items.find((item: { product: unknown }) => item.product);
  expect(target).toBeTruthy();
  const proposedProduct = {
    ...target.product,
    id: "NTR-E2E-MOCK-01",
    name: "E2E 公式候補収納ベッド",
    price_snapshot: Math.max(1_000, target.price_snapshot - 2_000),
  };
  const afterPrice = plan.price.known_total - target.price_snapshot + proposedProduct.price_snapshot;
  const suggestion = {
    id: "ai-preview-11111111-1111-1111-1111-111111111111",
    strategy: "BALANCED",
    action: "REPLACE",
    title: "収納を保ちながら予算を調整",
    rationale: "同じ役割の許可済み候補へ1点だけ置き換えます。",
    tradeoff: "現在の商品はPLANから外れます。",
    target: {
      item_id: target.id,
      product_id: target.product.id,
      name: target.product.name,
      role: target.role,
      price_snapshot: target.price_snapshot,
    },
    proposed_product: {
      item_id: null,
      product_id: proposedProduct.id,
      name: proposedProduct.name,
      role: target.role,
      price_snapshot: proposedProduct.price_snapshot,
    },
    before_price: plan.price.known_total,
    after_price: afterPrice,
    price_delta: afterPrice - plan.price.known_total,
    before_fit: beforeFit,
    after_fit: afterFit,
  };
  const updatedPlan = {
    ...plan,
    items: plan.items.map((item: { id: number }) => item.id === target.id
      ? { ...item, product: proposedProduct, price_snapshot: proposedProduct.price_snapshot, mutation_state: "REPLACED" }
      : item),
    price: { ...plan.price, known_total: afterPrice },
  };
  let applied = false;
  let suggestionRequested = false;

  await page.route(`${API_BASE_URL}/api/ai/status`, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ enabled: true, configured: true, available: true, verified: true, reason_code: "READY", model: "gpt-5.6" }),
  }));
  await page.route(`${API_BASE_URL}/api/plans/${plan.id}/fit`, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(applied ? afterFit : beforeFit),
  }));
  await page.route(`${API_BASE_URL}/api/plans/${plan.id}/ai/suggestions`, async (route) => {
    const body = route.request().postDataJSON();
    expect(body.profile.priority_focus).toBe("BUDGET");
    suggestionRequested = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        policy_version: beforeFit.policy_version,
        profile: { ...body.profile, source: "SAVED_PROFILE" },
        current_fit: beforeFit,
        suggestions: [suggestion],
      }),
    });
  });
  await page.route(`${API_BASE_URL}/api/plans/${plan.id}/ai/apply`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({ suggestion_id: suggestion.id });
    applied = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plan: updatedPlan, suggestion, before_fit: beforeFit, after_fit: afterFit }),
    });
  });

  await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
  await page.goto(`/plans/${plan.id}/edit`);
  await expect(page.getByRole("heading", { name: "自分向けに変更する" })).toBeVisible();
  await page.getByRole("button", { name: "AIと一緒に配置イメージを試す" }).click();
  const studio = page.getByRole("dialog", { name: "AIと一緒に配置イメージを試す" });
  await studio.getByRole("tab", { name: "AIアドバイス" }).click();
  await studio.getByRole("button", { name: "希望条件から商品候補を見直す" }).click();
  const dialog = page.getByRole("dialog", { name: "希望条件から調整案をつくる" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("最優先").selectOption("BUDGET");
  await dialog.getByRole("button", { name: "希望条件を保存して再計算" }).click();
  await dialog.getByRole("button", { name: "この条件でAI調整案をつくる" }).click();

  await expect(dialog.getByText(suggestion.title)).toBeVisible();
  expect(suggestionRequested).toBeTruthy();
  await expect(page.getByText(target.product.name).first()).toBeVisible();
  await dialog.getByRole("button", { name: "この提案をPLANに反映" }).click();

  await expect(page.getByText(proposedProduct.name).first()).toBeVisible();
  await expect(dialog.getByRole("status")).toContainText(`${beforeFit.overall_score} → ${afterFit.overall_score}`);
  await expect(dialog.getByRole("img", { name: `PLAN適合度 ${afterFit.overall_score}点` })).toBeVisible();
});


test("visual composition keeps PLAN product continuity and returns bounded image feedback", async ({ page, request }) => {
  const sessionId = `e2e-visual-plan-${Date.now()}`;
  const planResponse = await request.post(`${API_BASE_URL}/api/plans/from-coordinate/coord-001`, {
    headers: { "X-Session-ID": sessionId },
    data: { budget_max: 50_000 },
  });
  expect(planResponse.ok()).toBeTruthy();
  const plan = await planResponse.json();
  const productItems = plan.items.filter((item: { product: unknown }) => item.product);
  let visualRequestChecked = false;

  await page.route(`${API_BASE_URL}/api/ai/status`, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ enabled: true, configured: true, available: true, verified: true, reason_code: "READY", model: "gpt-4o-mini" }),
  }));
  await page.route(`${API_BASE_URL}/api/plans/${plan.id}/ai/visual-review`, async (route) => {
    const body = route.request().postDataJSON();
    expect(body.image_data_url).toMatch(/^data:image\/jpeg;base64,/);
    expect(body.layout_items.map((item: { item_id: number }) => item.item_id).sort()).toEqual(
      productItems.map((item: { id: number }) => item.id).sort(),
    );
    expect(body.layout_items.map((item: { product_id: string }) => item.product_id).sort()).toEqual(
      productItems.map((item: { product: { id: string } }) => item.product.id).sort(),
    );
    visualRequestChecked = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        policy_version: "prototype-recommendation-policy-1.1-visual-1",
        image_used: true,
        summary: "中央の商品群に視線が集まり、右側の余白がやや広く見えます。",
        observations: [
          {
            code: "VISUAL_BALANCE", label: "視覚的な重心",
            observation: "主家具が中央寄りです。", evidence: "主家具と収納が中央から左側に集まっています。",
            suggestion: "収納を少し左へ動かして比較してください。", confidence: "HIGH",
          },
          {
            code: "STYLE_COHERENCE", label: "スタイルのまとまり",
            observation: "明るい印象が続いています。", evidence: "近い明度の商品画像が並んでいます。",
            suggestion: "アクセントを一箇所に絞ってください。", confidence: "MEDIUM",
          },
        ],
        next_action: "収納を左へ少し移動して、左右の余白を比較してください。",
        layout_changes: [{
          item_id: productItems[1].id,
          x: 0.18,
          y: 0.68,
          scale: 0.95,
          rotation: 0,
          reason: "中央の商品と距離を取り、左右の重心を比較するためです。",
        }],
        disclaimer: "機能検証用の視覚評価です。実寸・設置可否・安全性を判定するものではありません。",
      }),
    });
  });

  await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
  await page.goto(`/plans/${plan.id}/edit`);
  await page.getByRole("button", { name: "AIと一緒に配置イメージを試す" }).click();
  const visualStudio = page.getByRole("dialog", { name: "AIと一緒に配置イメージを試す" });
  await expect(visualStudio).toBeVisible();
  for (const item of productItems) await expect(visualStudio.getByText(item.product.name)).toBeVisible();

  await visualStudio.getByRole("button", { name: "この配置をAIと一緒に見直す" }).click();

  await expect(visualStudio.getByRole("tab", { name: "AIアドバイス" })).toHaveAttribute("aria-selected", "true");
  await expect(visualStudio.getByText("中央の商品群に視線が集まり、右側の余白がやや広く見えます。")).toBeVisible();
  await visualStudio.getByRole("button", { name: "AI案を画面でプレビュー" }).click();
  await visualStudio.getByRole("button", { name: "このAI案を保存" }).click();
  await expect(visualStudio.getByText("このPLANに保存しました")).toBeVisible();
  const restored = await request.get(`${API_BASE_URL}/api/plans/${plan.id}/visual-layout`, { headers: { "X-Session-ID": sessionId } });
  expect(restored.ok()).toBeTruthy();
  expect((await restored.json()).version).toBe(1);
  expect(visualRequestChecked).toBeTruthy();
});
