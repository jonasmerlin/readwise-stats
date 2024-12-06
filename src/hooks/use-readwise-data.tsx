export interface ReadwiseDocument {
  author: string;
  category: string;
  content: string | null;
  created_at: string;
  first_opened_at: string;
  id: string;
  image_url: string;
  last_moved_at: string;
  last_opened_at: string;
  location: string;
  notes: string;
  parent_id: string | null;
  published_date: number;
  reading_progress: number;
  saved_at: string;
  site_name: string;
  source: string;
  source_url: string;
  summary: string;
  tags: { name: string };
  title: string;
  updated_at: string;
  url: string;
  word_count: number;
}

export async function fetchDocumentListApi(
  token: string | undefined,
  updatedAfter: string | null | undefined = null,
  location: string | null | undefined = null,
) {
  if (!token) {
    return [];
  }

  const fullData: ReadwiseDocument[] = [];
  let nextPageCursor = null;

  while (true) {
    const queryParams = new URLSearchParams("type=article");
    // const queryParams = new URLSearchParams("type=article");
    if (nextPageCursor) {
      queryParams.append("pageCursor", nextPageCursor);
    }
    if (updatedAfter) {
      queryParams.append("updatedAfter", updatedAfter);
    }
    if (location) {
      queryParams.append("location", location);
    }
    console.log(
      "Making export api request with params " + queryParams.toString(),
    );

    await new Promise((resolve) => setTimeout(resolve, 3500));

    const response = await fetch(
      "https://readwise.io/api/v3/list/?" + queryParams.toString(),
      {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
        },
      },
    );
    const responseJson = await response.json();
    fullData.push(...responseJson["results"]);
    nextPageCursor = responseJson["nextPageCursor"];
    if (!nextPageCursor) {
      break;
    }
  }

  return fullData;
}
