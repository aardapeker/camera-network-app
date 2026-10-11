interface AddUserData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

interface AddUserResponse {
  message: string;
  email: string;
}

async function addUser(userData: AddUserData): Promise<AddUserResponse> {
  const headers = {
    "Content-Type": "application/json",
  };

  const newUserData = {
    ...userData,
    authorities: ["ROLE_CLIENT"],
    articles: [],
    drafts: [],
    notes: [],
  };

  const response = await fetch("/auth/signup", {
    method: "POST",
    headers,
    body: JSON.stringify(newUserData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }

  return await response.json();
}

export default addUser;
