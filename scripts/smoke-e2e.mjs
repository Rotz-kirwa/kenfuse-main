#!/usr/bin/env node

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:4010";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "kenfuse88@gmail.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "adminkenfuse88";
const failures = [];
const notes = [];

function note(message) {
  notes.push(message);
}

function fail(message) {
  failures.push(message);
}

async function req(path, { method = "GET", token, body, expect = [200] } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!expect.includes(response.status)) {
    fail(`${method} ${path} expected ${expect.join("/")} got ${response.status}: ${text.slice(0, 260)}`);
  }

  return { status: response.status, payload };
}

async function run() {
  const stamp = Date.now();

  const health = await req("/health", { expect: [200] });
  note(`health=${health.status}`);

  const preFeed = await req("/api/activities/feed", { expect: [200] });
  const preCount = Array.isArray(preFeed.payload?.activities) ? preFeed.payload.activities.length : 0;

  const userEmail = `smoke.user.${stamp}@example.com`;
  const userPassword = "SmokePass123!";

  const register = await req("/api/auth/register", {
    method: "POST",
    expect: [201],
    body: { fullName: "Smoke User", email: userEmail, password: userPassword },
  });
  const userToken = register.payload?.token;
  if (!userToken) fail("register did not return token");

  const login = await req("/api/auth/login", {
    method: "POST",
    expect: [200],
    body: { email: userEmail, password: userPassword },
  });
  const loginToken = login.payload?.token;
  if (!loginToken) fail("login did not return token");

  await req("/api/auth/me", { token: loginToken, expect: [200] });

  await req("/api/legacy-plan/me", {
    method: "PUT",
    token: loginToken,
    expect: [200],
    body: {
      wishes: JSON.stringify({ personalInfo: { fullName: "Smoke User" } }),
      instructions: JSON.stringify({ step1PersonalIdentity: { fullName: "Smoke User" } }),
      assets: [],
      beneficiaries: [],
    },
  });
  await req("/api/legacy-plan/me", { token: loginToken, expect: [200] });

  const memorial = await req("/api/memorials", {
    method: "POST",
    token: loginToken,
    expect: [201],
    body: {
      fullName: `Smoke Memorial ${stamp}`,
      visibilityType: "PUBLIC",
      dateOfPassing: new Date().toISOString(),
      description: "Smoke memorial description",
    },
  });
  const memorialId = memorial.payload?.memorial?.id;
  if (!memorialId) fail("memorial create did not return id");

  await req("/api/memorials", { expect: [200] });
  if (memorialId) {
    await req(`/api/memorials/${memorialId}/tributes`, {
      method: "POST",
      expect: [201],
      body: { authorName: "Smoke Guest", message: "Respectful tribute message" },
    });
  }

  const fundraiser = await req("/api/fundraisers", {
    method: "POST",
    token: loginToken,
    expect: [201],
    body: {
      title: `Smoke Fundraiser ${stamp}`,
      story: "This is a smoke-test fundraiser story with enough length.",
      targetAmount: 12000,
      currency: "KES",
      visibilityType: "LINK_ONLY",
    },
  });
  const fundraiserId = fundraiser.payload?.fundraiser?.id;
  const inviteCode = fundraiser.payload?.fundraiser?.inviteCode;
  if (!fundraiserId) fail("fundraiser create did not return id");
  if (!inviteCode) fail("fundraiser create did not return inviteCode");

  if (fundraiserId) {
    await req(`/api/fundraisers/${fundraiserId}`, { expect: [403] });
    if (inviteCode) {
      const encodedCode = encodeURIComponent(inviteCode);
      await req(`/api/fundraisers/${fundraiserId}?inviteCode=${encodedCode}`, { expect: [200] });
      await req(`/api/fundraisers/${fundraiserId}/contributions`, {
        method: "POST",
        expect: [403],
        body: { contributorName: "No Code", amount: 500 },
      });
      await req(`/api/fundraisers/${fundraiserId}/contributions?inviteCode=${encodedCode}`, {
        method: "POST",
        expect: [201],
        body: { contributorName: "With Code", contributorEmail: userEmail, amount: 1000, message: "Smoke contribution" },
      });
      await req(`/api/fundraisers/${fundraiserId}/invite`, { token: loginToken, expect: [200] });
    }
  }

  await req("/api/activities/me", { token: loginToken, expect: [200] });

  const adminLogin = await req("/api/auth/login", {
    method: "POST",
    expect: [200],
    body: { email: adminEmail, password: adminPassword },
  });
  const adminToken = adminLogin.payload?.token;
  const adminRole = adminLogin.payload?.user?.role;
  if (!adminToken) fail("admin login did not return token");
  if (adminRole !== "ADMIN") fail(`admin login role was ${String(adminRole)}`);

  await req("/api/admin/overview", { token: adminToken, expect: [200] });
  const adminServices = await req("/api/admin/services", { token: adminToken, expect: [200] });
  const firstService = adminServices.payload?.services?.[0];
  if (firstService?.id) {
    await req(`/api/admin/services/${firstService.id}`, {
      method: "PATCH",
      token: adminToken,
      expect: [200],
      body: { imageUrl: "https://example.com/smoke-service.jpg" },
    });
  } else {
    fail("admin services returned empty list");
  }

  await req("/api/services", { expect: [200] });

  const categories = await req("/api/marketplace/categories", { expect: [200] });
  const firstCategory = categories.payload?.categories?.[0];
  if (firstCategory?.id) {
    const listing = await req("/api/admin/listings", {
      method: "POST",
      token: adminToken,
      expect: [201],
      body: {
        categoryId: firstCategory.id,
        vendorName: "Smoke Vendor",
        title: `Smoke Listing ${stamp}`,
        description: "Smoke listing description for production validation.",
        price: 35000,
        currency: "KES",
        vendorContact: "+254700123456",
        imageUrl: "https://example.com/smoke-listing.jpg",
      },
    });

    const listingId = listing.payload?.listing?.id;
    if (listingId) {
      await req(`/api/admin/listings/${listingId}/contact`, {
        method: "PATCH",
        token: adminToken,
        expect: [200],
        body: { vendorContact: "+254700654321" },
      });
    } else {
      fail("admin listing create did not return id");
    }
  } else {
    fail("marketplace categories empty");
  }

  const listings = await req("/api/marketplace/listings", { expect: [200] });
  if (!Array.isArray(listings.payload?.listings)) {
    fail("marketplace listings response invalid");
  }

  const postFeed = await req("/api/activities/feed", { expect: [200] });
  const postCount = Array.isArray(postFeed.payload?.activities) ? postFeed.payload.activities.length : 0;
  if (postCount < preCount) {
    fail(`activities feed count regressed: before=${preCount} after=${postCount}`);
  }

  if (failures.length > 0) {
    console.error("SMOKE_TEST_RESULT=FAIL");
    for (const item of failures) console.error(`FAIL: ${item}`);
    process.exit(1);
  }

  console.log("SMOKE_TEST_RESULT=PASS");
  for (const item of notes) console.log(`NOTE: ${item}`);
  console.log("Smoke suite completed successfully.");
}

run().catch((error) => {
  console.error("SMOKE_TEST_RESULT=FAIL");
  console.error(error);
  process.exit(1);
});
