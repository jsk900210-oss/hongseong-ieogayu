export type RecipeItem = { id: string; title: string; ingredient: string; summary: string; sourceName: string; sourceUrl: string; isCommunity?: boolean; author?: string };

// 원문 URL과 재료·조리 과정이 1:1로 확인된 레시피만 추가한다.
// 제목만 조합한 레시피나 포털 첫 화면 링크는 출처로 사용하지 않는다.
const verified10000Recipes: Array<[string, string, string]> = [
  ["마늘", "마늘쫑고추장무침 만드는 법", "6870562"], ["마늘", "마늘쫑무침", "6891443"], ["마늘", "마늘양념 만들기", "6867332"], ["마늘", "마늘쫑 볶음", "6895838"], ["마늘", "마늘종 새우볶음", "4982720"],
  ["김", "전자레인지로 바삭하게 김 굽는 법", "6923385"], ["김", "김 장아찌", "6886390"], ["김", "김구이와 달래양념장", "6842110"], ["김", "청포묵 김무침", "6853470"], ["김", "백종원 김무침", "6883712"],
  ["대하·새우", "간단한 새우요리", "6916958"], ["대하·새우", "이탈리안 새우요리와 마늘빵", "6880372"], ["대하·새우", "칠리새우", "6881815"], ["대하·새우", "하와이안 쉬림프", "6901449"], ["대하·새우", "새우요리 완벽정복", "6919063"],
  ["두부", "가리바타 두부", "6904274"], ["두부", "양념순두부와 두부김치", "6882281"], ["두부", "굴 소스 찹쌀 가지 두부요리", "6837169"], ["두부", "양념장 곁들인 두부", "6894281"], ["두부", "두부조림", "6906655"],
  ["한우·소고기", "감자를 넣은 매콤한 쇠고기요리", "3288891"],
];

export const officialRecipes: RecipeItem[] = [
  { id: "foodnuri-garlic-sprout-pasta", title: "마늘종 새우 파스타", ingredient: "마늘", summary: "올리브유에 마늘과 양파를 볶은 뒤 마늘종과 새우를 넣어 만드는 원팬 파스타예요.", sourceName: "농식품정보누리", sourceUrl: "https://www.foodnuri.go.kr/portal/bbs/B0000284/view.do?deleteCd=0&menuNo=300089&nttId=234839&pageIndex=1" },
  { id: "foodnuri-lemon-mayo-shrimp", title: "레몬마요 새우", ingredient: "대하", summary: "손질한 새우에 튀김옷을 입혀 튀긴 뒤 레몬 마요 소스와 곁들이는 조리법이에요.", sourceName: "농식품정보누리", sourceUrl: "https://www.foodnuri.go.kr/portal/bbs/B0000279/view.do?deleteCd=0&menuNo=300056&nttId=234728&pageIndex=1" },
  { id: "foodnuri-shrimp-wonton", title: "새우완탕", ingredient: "대하", summary: "다진 새우와 부추를 만두피에 넣어 빚고, 육수에 넣어 끓이는 따뜻한 완탕이에요.", sourceName: "농식품정보누리", sourceUrl: "https://www.foodnuri.go.kr/portal/bbs/B0000279/view.do?deleteCd=0&menuNo=300056&nttId=228176&pageIndex=120&searchCnd=3&searchWrd=" },
  { id: "foodnuri-tofu-sushi", title: "두부초밥", ingredient: "두부", summary: "물기를 뺀 두부와 오색미, 마른 김을 활용하는 두부 초밥 레시피예요.", sourceName: "농식품정보누리", sourceUrl: "https://www.foodnuri.go.kr/portal/bbs/B0000279/view.do?menuNo=300056&nttId=229052&pageIndex=&searchCnd=3" },
  { id: "10000-tofu-jorim", title: "기본 두부조림", ingredient: "두부", summary: "두부에 고춧가루·간장 양념장을 더해 졸이는 기본 반찬 조리법이에요.", sourceName: "만개의레시피", sourceUrl: "https://m.10000recipe.com/recipe/7021613" },
  { id: "foodnuri-hanwoo-bulnakjuk", title: "한우 불낙죽", ingredient: "한우", summary: "불린 쌀을 볶아 다시마물과 한우 안심, 낙지, 채소를 넣어 끓이는 죽이에요.", sourceName: "농식품정보누리", sourceUrl: "https://foodnuri.go.kr/portal/bbs/B0000279/view.do?menuNo=300056&nttId=234956" },
  { id: "foodnuri-hanwoo-walnut-hamburg", title: "한우 호두 함박스테이크", ingredient: "한우", summary: "다진 한우와 호두, 볶은 양파를 반죽해 노릇하게 구운 함박스테이크예요.", sourceName: "농식품정보누리", sourceUrl: "https://foodnuri.go.kr/portal/bbs/B0000279/view.do?menuNo=300056&nttId=234956" },
  { id: "10000-beef-radish-soup", title: "소고기 뭇국", ingredient: "한우·소고기", summary: "참기름에 소고기와 무를 볶은 뒤 물과 대파, 다진 마늘을 넣고 끓이는 국이에요.", sourceName: "만개의레시피", sourceUrl: "https://www.10000recipe.com/recipe/6934181" },
  { id: "naver-honey-shrimp-pizza", title: "10분 꿀 새우 피자", ingredient: "대하·새우", summary: "냉동 새우와 다진 마늘을 손질해 또띠아 위에 올려 완성하는 새우 피자예요.", sourceName: "네이버 블로그 · 스푼비", sourceUrl: "https://blog.naver.com/PostView.nhn?blogId=spoonb&logNo=223101172000" },
  { id: "naver-frozen-tofu-gangjeong", title: "얼린 두부강정", ingredient: "두부", summary: "냉동 두부에 전분을 묻히고 고추장 양념을 더해 만드는 두부강정이에요.", sourceName: "네이버 블로그 · kminji328", sourceUrl: "https://blog.naver.com/PostView.naver?blogId=kminji328&logNo=223202537717" },
  ...verified10000Recipes.map(([ingredient, title, recipeId]) => ({
    id: `10000-${recipeId}`,
    title,
    ingredient,
    summary: "원문에 재료와 조리 순서가 공개된 레시피예요. 상세한 계량과 만드는 법은 출처에서 확인해 주세요.",
    sourceName: "만개의레시피",
    sourceUrl: `https://www.10000recipe.com/recipe/${recipeId}`,
  })),
];
