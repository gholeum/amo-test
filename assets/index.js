const accessToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImVlZDBhYzM1OWYzNDZhM2Q2N2IzNjY2YzVhZGVkYTAzNjM1NTBhZjhkMDQ4ZWE3NDRlODA0OTUwY2RmYmJmN2RlMGI2OGYxODcwMTJiZDgyIn0.eyJhdWQiOiIyYjY4ZDkzOC01OGQ4LTRkMTYtOTE4MC0yYmI3MDE3ZTI1ZGQiLCJqdGkiOiJlZWQwYWMzNTlmMzQ2YTNkNjdiMzY2NmM1YWRlZGEwMzYzNTUwYWY4ZDA0OGVhNzQ0ZTgwNDk1MGNkZmJiZjdkZTBiNjhmMTg3MDEyYmQ4MiIsImlhdCI6MTcyNzUxODk1MSwibmJmIjoxNzI3NTE4OTUxLCJleHAiOjE3Mjc2MDUzNTEsInN1YiI6IjExNTc5NDc0IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxOTc3NzA2LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJwdXNoX25vdGlmaWNhdGlvbnMiLCJmaWxlcyIsImNybSIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiNjcyZTU0NDAtNDJlZi00MDEyLTg5YjctZTg4MGQyMDllNzkyIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.EyGXvdRxmELb9wZIRDHbEP85pg7hfLI3oa9iMf-V2RE2FveldCPwWXlyuVZxpTzYI_APOBkRXEL3scSoY0CJdjeIO7bBDZdMax5vJpc-iA2wTDgLnwvwg76at9w8iBPBwmPiPhttiCrbd9-UA42DMaaP1KT3FidwSFrHCyNkI9JUXzL06kERcp2ex4tm311EEGwvB2QN2oDD7FstvYfgoN7uqIZw_vGWf2myzFkeXGu9a8iLDSF1Ylf6c6vzhxtqf1FUmgOeXUMR-ihemYz5rBbM7-qG0j_hwFZ7MqBmdMdHNqEzIQAlOLcUa6GLpQoIXnE5JEyrSH2YV6mgx9cwKA";
const accountId = "pleiadd";
// Такая практика хранения accessToken и accountId не надёжна, однако в условиях тестового задания не было прописано, можно ли использовать node.js для создания и использования конфигурационного файла, поэтому эти значение этих переменных задаётся в файле основного скрипта.
const dealsTableBody = document.querySelector("#dealsTable tbody");

async function fetchDeals() {
  const spinnerSpace = document.querySelector(".spinner-space");

  let page = 1;

  spinnerSpace.style.display = "flex";

  while (true) {
    try {
      const response = await fetch(
        `https://${accountId}.amocrm.ru/api/v4/leads?page=${page}&limit=3`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Ошибка: ${response.status} - ${response.statusText}. Ответ: ${errorText}`
        );
      }

      const responseText = await response.text();

      let data = JSON.parse(responseText);

      const leads = data._embedded.leads;

      for (let i = 0; i < leads.length; i++) {
        addDealToTable(leads[i]);
      }

      if (!data._links.next) {
        spinnerSpace.style.display = "none";
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      page++;
    } catch (error) {
      console.error("Ошибка при получении сделок:", error);
      spinnerSpace.style.display = "none";
      break;
    }
  }
}

function addDealToTable(deal) {
  const row = document.createElement("tr");
  row.onclick = () => toggleDealDetails(row, deal);

  const price = deal.price !== undefined ? deal.price : "Не указана цена";

  row.innerHTML = `
         <td>${deal.id}</td>
         <td>${deal.name}</td>
         <td>${price}</td>
     `;

  const detailRow = document.createElement("tr");
  detailRow.classList.add("detail-row");
  detailRow.style.display = "none";

  detailRow.innerHTML = `<td colspan="3"></td>`;

  dealsTableBody.appendChild(row);
  dealsTableBody.appendChild(detailRow);
}

function toggleDealDetails(row, deal) {
  const detailRow = row.nextElementSibling;

  if (detailRow.style.display !== "none") {
    detailRow.style.display = "none";
    return;
  } else {
    closeAllDetails();
  }

  if (detailRow.style.display === "none") {
    const closestTaskAt = deal.closest_task_at;
    const formattedDate = formatDate(closestTaskAt);
    const taskStatus = getTaskStatus(deal);
    const taskStatusCircle = dealStatusCircle(taskStatus);

    detailRow.innerHTML = `
         <td colspan="3">
           <strong>ID:</strong> ${deal.id}<br>
           <strong>Название:</strong> ${deal.name}<br>
           <strong>Дата ближайшей задачи:</strong> ${formattedDate} ${taskStatusCircle}
         </td>
       `;
    detailRow.style.display = "";
  } else {
    detailRow.style.display = "none";
  }
}

function closeAllDetails() {
  const detailRows = document.querySelectorAll(".detail-row");
  detailRows.forEach((row) => {
    row.style.display = "none";
  });
}

function formatDate(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function getTaskStatus(dealData) {
  const taskDate = new Date(dealData.closest_task_at * 1000);
  if (taskDate == null) return "default";

  const now = new Date();
  if (taskDate < now) return "overdue";
  if (taskDate.toDateString() === now.toDateString()) return "today";
  if (taskDate.getTime() - now.getTime() < 86400000) return "tomorrow";
  return "future";
}

function dealStatusCircle(status) {
  let color;
  switch (status) {
    case "overdue":
      color = "red";
      break;
    case "today":
      color = "green";
      break;
    case "tomorrow":
      color = "yellow";
      break;
    case "future":
      color = "orange";
      break;
    default:
      color = "gray";
  }
  return `<span style="display:inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color};"></span>`;
}

fetchDeals();
