async function testSignup() {
  try {
    const res = await fetch("https://payhold-backend.onrender.com/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test User API",
        email: "test_api_50@example.com",
        phone: "09088776655",
        password: "password123",
        role: "buyer"
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (error) {
    console.error("Network Error:", error.message);
  }
}

testSignup();
