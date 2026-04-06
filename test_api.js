async function test() {
  const rs = await fetch('http://localhost:3000/api/parse-sms', {
    method: 'POST',
    body: JSON.stringify({ amount: "500", type: "debit", merchant: "Uber" }),
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await rs.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
