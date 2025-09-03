document.getElementById("predictForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    occasion: document.getElementById("occasion").value,
    top: document.getElementById("top").value,
    bottom: document.getElementById("bottom").value,
    shoes: document.getElementById("shoes").value,
    weather: document.getElementById("weather").value,
    colors: document.getElementById("colors").value,
    accessories: document.getElementById("accessories").value,
  };

  const res = await fetch("http://localhost:5000/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  // Map feedback to colored list
  const feedbackHTML = result.feedback
    .map((f) => {
      let color = "black"; // default neutral
      if (f.startsWith("✓") || f.startsWith("⌚")) color = "green";
      else if (
        f.startsWith("✗") ||
        f.startsWith("☀️") ||
        f.startsWith("❄️") ||
        f.startsWith("⚠️") ||
        f.startsWith("☔")
      )
        color = "red";
      return `<li style="color:${color}">${f}</li>`;
    })
    .join("");

  document.getElementById("result").innerHTML = `
    <h3>Prediction Result</h3>
    <p><b>Score:</b> ${result.score}%</p>
    <p><b>Category:</b> ${result.category}</p>
    <p><b>Feedback:</b></p>
    <ul>${feedbackHTML}</ul>
  `;
});
