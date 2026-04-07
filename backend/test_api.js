async function test() {
  try {
    const resAuth = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'admin123' })
    });
    const authData = await resAuth.json();
    console.log('Login status:', resAuth.status);
    
    const resDash = await fetch('http://localhost:5000/api/dashboard/admin', {
      headers: { 'Authorization': `Bearer ${authData.token}` }
    });
    const dashData = await resDash.json();
    console.log('Dashboard status:', resDash.status);
    console.log('Data:', JSON.stringify(dashData, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
