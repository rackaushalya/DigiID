// If you run frontend via backend server.js (recommended), same origin works:
const API_BASE = "/api";

function showMsg(type, text) {
  const msg = $("#msg");
  msg.removeClass("d-none alert-success alert-danger alert-warning")
     .addClass(type === "success" ? "alert-success" : type === "warning" ? "alert-warning" : "alert-danger")
     .text(text);
  setTimeout(() => msg.addClass("d-none"), 2500);
}

function getFormData() {
  return {
    NDI_ID: $("#NDI_ID").val().trim(),
    FirstName: $("#FirstName").val().trim(),
    LastName: $("#LastName").val().trim(),
    DoB: $("#DoB").val().trim(),
    Email: $("#Email").val().trim(),
    Phone: $("#Phone").val().trim(),
    Occupation: $("#Occupation").val().trim(), // backend converts to array
    Nationality: $("#Nationality").val().trim(),
    Blood_Group: $("#Blood_Group").val().trim()
  };
}

function resetForm() {
  $("#citizenForm")[0].reset();
  $("#editMode").val("false");
  $("#originalNdi").val("");
  $("#cancelEditBtn").addClass("d-none");
  $("#saveBtn").text("Save Citizen");
  $("#NDI_ID").prop("disabled", false);
}

function renderRow(c) {
  const fullName = `${c.FirstName} ${c.LastName}`;
  return `
    <tr data-ndi="${c.NDI_ID}">
      <td>${c.NDI_ID}</td>
      <td>${fullName}</td>
      <td>${c.DoB}</td>
      <td>${c.Email}</td>
      <td>${c.Phone}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1 editBtn">Edit</button>
        <button class="btn btn-sm btn-danger deleteBtn">Delete</button>
      </td>
    </tr>
  `;
}

function loadCitizens() {
  $.ajax({
    url: `${API_BASE}/citizens`,
    method: "GET",
    dataType: "json",
    success: function (data) {
      const body = $("#citizenTableBody");
      body.empty();

      if (!data || data.length === 0) {
        body.append(`<tr><td colspan="6" class="text-center text-muted">No citizens found</td></tr>`);
        return;
      }

      data.forEach(c => body.append(renderRow(c)));
    },
    error: function (xhr) {
      showMsg("error", xhr.responseJSON?.message || "Failed to load citizens");
    }
  });
}

function createCitizen(payload) {
  $.ajax({
    url: `${API_BASE}/citizens`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function () {
      showMsg("success", "Citizen saved!");
      resetForm();
      loadCitizens();
    },
    error: function (xhr) {
      showMsg("error", xhr.responseJSON?.message || "Save failed");
    }
  });
}

function updateCitizen(originalNdi, payload) {
  $.ajax({
    url: `${API_BASE}/citizens/${encodeURIComponent(originalNdi)}`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function () {
      showMsg("success", "Citizen updated!");
      resetForm();
      loadCitizens();
    },
    error: function (xhr) {
      showMsg("error", xhr.responseJSON?.message || "Update failed");
    }
  });
}

function deleteCitizen(ndiId) {
  $.ajax({
    url: `${API_BASE}/citizens/${encodeURIComponent(ndiId)}`,
    method: "DELETE",
    success: function () {
      showMsg("success", "Citizen deleted!");
      loadCitizens();
    },
    error: function (xhr) {
      showMsg("error", xhr.responseJSON?.message || "Delete failed");
    }
  });
}

function fillForm(citizen) {
  $("#NDI_ID").val(citizen.NDI_ID).prop("disabled", true);
  $("#FirstName").val(citizen.FirstName);
  $("#LastName").val(citizen.LastName);
  $("#DoB").val(citizen.DoB);
  $("#Email").val(citizen.Email);
  $("#Phone").val(citizen.Phone);
  $("#Occupation").val((citizen.Occupation || []).join(", "));
  $("#Nationality").val(citizen.Nationality);
  $("#Blood_Group").val(citizen.Blood_Group);

  $("#editMode").val("true");
  $("#originalNdi").val(citizen.NDI_ID);
  $("#cancelEditBtn").removeClass("d-none");
  $("#saveBtn").text("Update Citizen");
}

// Prevent Enter key from submitting early + move focus to next input
function enableEnterToNext() {
  const inputs = $("#citizenForm").find("input:not([type=hidden])");
  inputs.on("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const idx = inputs.index(this);
      if (idx >= 0 && idx < inputs.length - 1) inputs.eq(idx + 1).focus();
      else $("#saveBtn").focus();
    }
  });
}

$(document).ready(function () {
  // Buttons
  $("#clearBtn").on("click", resetForm);
  $("#cancelEditBtn").on("click", resetForm);
  $("#refreshBtn").on("click", loadCitizens);

  // Submit
  $("#citizenForm").on("submit", function (e) {
    e.preventDefault();

    const payload = getFormData();

    // simple validation
    if (!payload.NDI_ID || !payload.FirstName || !payload.LastName) {
      showMsg("warning", "Please fill required fields");
      return;
    }

    const editMode = $("#editMode").val() === "true";
    if (!editMode) {
      createCitizen(payload);
    } else {
      const originalNdi = $("#originalNdi").val();
      // do NOT allow changing NDI_ID during edit (disabled anyway)
      delete payload.NDI_ID;
      updateCitizen(originalNdi, payload);
    }
  });

  // Table actions (event delegation)
  $("#citizenTableBody").on("click", ".deleteBtn", function () {
    const ndi = $(this).closest("tr").data("ndi");
    if (confirm(`Delete citizen ${ndi}?`)) deleteCitizen(ndi);
  });

  $("#citizenTableBody").on("click", ".editBtn", function () {
    const ndi = $(this).closest("tr").data("ndi");

    $.ajax({
      url: `${API_BASE}/citizens/${encodeURIComponent(ndi)}`,
      method: "GET",
      dataType: "json",
      success: function (citizen) {
        fillForm(citizen);
      },
      error: function (xhr) {
        showMsg("error", xhr.responseJSON?.message || "Failed to load citizen");
      }
    });
  });

  enableEnterToNext();
  loadCitizens();
});
