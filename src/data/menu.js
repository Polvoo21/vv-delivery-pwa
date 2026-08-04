import { PRODUCT_NUTRITION } from "./productNutrition.js";

import { PRODUCT_IMAGES } from "./productImages.js";

const productImage = "/assets/site/product-photo-placeholder.png";

export const MENU_CATEGORIES = [
  {
    id: "pizza",
    title: "Пицца",
    shortTitle: "Пиццы",
    image: productImage,
    description: "Итальянская пицца на тесте с долгой ферментацией, румяным бортом и понятными начинками для всей семьи."
  },
  {
    id: "summer",
    title: "Летнее меню",
    shortTitle: "Летнее",
    image: productImage,
    description: "Сезонное меню 2026: легкие салаты, окрошка, поке, боулы, итальянские лепешки, клубничный суп и лимонад."
  },
  {
    id: "breakfast",
    title: "Завтраки",
    shortTitle: "Завтраки",
    image: productImage,
    description: "Утренние блюда, каши, сырники, тосты и сытные завтраки каждый день."
  },
  {
    id: "breakfast-addon",
    title: "Добавить к завтраку",
    shortTitle: "К завтраку",
    image: productImage,
    description: "Дополнения к завтракам: лосось, авокадо, сметана, мед и варенье."
  },
  {
    id: "kids",
    title: "Детское меню",
    shortTitle: "Детям",
    image: productImage,
    description: "Понятные блюда для детей: супы, паста, пельмени, котлетки и детские пиццы."
  },
  {
    id: "soup",
    title: "Супы",
    shortTitle: "Супы",
    image: productImage,
    description: "Горячие супы и бульоны для обеда, ужина и семейного визита."
  },
  {
    id: "main",
    title: "Горячее",
    shortTitle: "Горячее",
    image: productImage,
    description: "Основные блюда: мясо, рыба, стейки, бургеры и горячие позиции."
  },
  {
    id: "pasta",
    title: "Паста",
    shortTitle: "Паста",
    image: productImage,
    description: "Паста и домашняя лапша с понятными соусами, рыбой, мясом и овощами."
  },
  {
    id: "salad",
    title: "Салаты",
    shortTitle: "Салаты",
    image: productImage,
    description: "Свежие салаты с овощами, рыбой, мясом и домашними соусами."
  },
  {
    id: "starter",
    title: "Закуски",
    shortTitle: "Закуски",
    image: productImage,
    description: "Закуски к столу, для компании и к семейному ужину."
  },
  {
    id: "dumplings",
    title: "Пельмени и вареники",
    shortTitle: "Пельмени",
    image: productImage,
    description: "Домашние пельмени и вареники со сметаной."
  },
  {
    id: "waffle",
    title: "Вафли",
    shortTitle: "Вафли",
    image: productImage,
    description: "Сладкие и картофельные вафли для завтрака или десерта."
  },
  {
    id: "side",
    title: "Гарниры",
    shortTitle: "Гарниры",
    image: productImage,
    description: "Овощи, рис и картофель к основным блюдам."
  },
  {
    id: "bread",
    title: "Хлеб",
    shortTitle: "Хлеб",
    image: productImage,
    description: "Фокачча, хлеб и хлебная корзинка к блюдам."
  },
  {
    id: "dessert",
    title: "Десерты",
    shortTitle: "Десерты",
    image: productImage,
    description: "Десерты по единой тестовой цене. Составы добавим отдельно."
  },
  {
    id: "drink",
    title: "Напитки",
    shortTitle: "Напитки",
    image: productImage,
    description: "Чай, кофе, фреши, смузи, милкшейки, лимонады и безалкогольные напитки."
  }
];

const categoryMap = Object.fromEntries(MENU_CATEGORIES.map((category) => [category.id, category]));

export const PIZZA_ADDONS = [
  { id: "mozzarella", name: "Моцарелла", weight: "+35 г", price: 125, image: productImage },
  { id: "parmesan", name: "Пармезан", weight: "+20 г", price: 125, image: productImage },
  { id: "pepperoni-addon", name: "Пепперони", weight: "+30 г", price: 125, image: productImage },
  { id: "mushrooms", name: "Шампиньоны", weight: "+30 г", price: 125, image: productImage },
  { id: "tomatoes", name: "Томаты черри", weight: "+40 г", price: 125, image: productImage },
  { id: "jalapeno", name: "Халапеньо", weight: "+20 г", price: 125, image: productImage },
  { id: "bacon", name: "Бекон", weight: "+25 г", price: 125, image: productImage },
  { id: "chicken", name: "Куриное филе", weight: "+45 г", price: 125, image: productImage }
];

function item({
  id,
  category,
  name,
  description = "",
  weight = "",
  price,
  oldPrice,
  badges = [],
  ingredients = [],
  featured = false,
  image,
  visual,
  nutrition,
  customizable = category === "pizza"
}) {
  const resolvedImage = image || PRODUCT_IMAGES[id] || productImage;

  return {
    id,
    category,
    name,
    description,
    weight,
    price,
    oldPrice,
    badges,
    ingredients,
    featured,
    image: resolvedImage,
    visual: visual || {
      image: resolvedImage,
      label: categoryMap[category]?.title || name
    },
    nutrition: nutrition || PRODUCT_NUTRITION[id] || null,
    customizable
  };
}

export const MENU = [
  item({ id: "signature-vv-pizza", category: "pizza", name: "Фирменная пицца «Вместе Вкуснее»", description: "пицца с тамбовским окороком, шампиньонами, моцареллой, пармезаном, микс салатом и трюфельным маслом.", weight: "490 г", price: 850, ingredients: ["тамбовский окорок","шампиньоны","моцарелла","пармезан","микс салат","трюфельное масло"], featured: true }),
  item({ id: "margarita", category: "pizza", name: "Маргарита", description: "пицца с моцареллой и томатным соусом.", weight: "400 г", price: 640, oldPrice: 710, ingredients: ["моцарелла","томатный соус"], featured: true }),
  item({ id: "pizza-carbonara", category: "pizza", name: "Карбонара", description: "пицца с беконом, моцареллой, пармезаном и сливочным соусом.", weight: "450 г", price: 690, oldPrice: 760, ingredients: ["бекон","моцарелла","пармезан","сливочный соус"], featured: true }),
  item({ id: "pepperoni", category: "pizza", name: "Пеперони", description: "пицца с пепперони, моцареллой, соусом чимичурри и томатным соусом. Халапеньо по желанию.", weight: "500 г", price: 660, oldPrice: 730, ingredients: ["пепперони","моцарелла","соус чимичурри","томатный соус"], featured: true }),
  item({ id: "three-salami", category: "pizza", name: "Три салями", description: "пицца с тамбовским окороком, беконом, пепперони, томатным соусом и моцареллой.", weight: "470 г", price: 660, ingredients: ["тамбовский окорок","бекон","пепперони","томатный соус","моцарелла"] }),
  item({ id: "polo-pizza", category: "pizza", name: "Поло", description: "пицца с курицей, болгарским перцем, шампиньонами и сливочным сыром.", weight: "490 г", price: 790, ingredients: ["курица","болгарский перец","шампиньоны","сливочный сыр"] }),
  item({ id: "pizza-burger-picca-620-g", category: "pizza", name: "Бургер пицца", description: "митболы из говядины и свинины, бекон, моцарелла, корнишоны, томаты, лук красный, соус томатный, соус бургерный.", weight: "620 г", price: 890, ingredients: ["митболы из говядины и свинины","бекон","моцарелла","корнишоны","томаты","лук красный","соус томатный"] }),
  item({ id: "five-cheese", category: "pizza", name: "Пять сыров", description: "пицца с камамбером, сливочным сыром, моцареллой, дор блю, чипсами пармезана и сливочным соусом.", weight: "430 г", price: 830, ingredients: ["камамбер","сливочный сыр","моцарелла","дор блю","чипсы пармезана","сливочный соус"] }),
  item({ id: "pear-dor-blue", category: "pizza", name: "Груша дор блю", description: "пицца с грушей, сыром дор блю, моцареллой, сливочным соусом и грецким орехом.", weight: "460 г", price: 790, ingredients: ["груша","сыр дор блю","моцарелла","сливочный соус","грецкий орех"] }),
  item({ id: "tom-yum-pizza", category: "pizza", name: "Том ям", description: "пицца с лососем, креветками, моцареллой, томатами черри, сливочным соусом и пастой том ям.", weight: "500 г", price: 990, ingredients: ["лосось","креветки","моцарелла","томаты черри","сливочный соус","паста том ям"] }),
  item({ id: "summer-seafood-salad", category: "summer", name: "Салат с морепродуктами", description: "тигровые креветки, мидии, кальмары, авокадо, апельсины, микс салат, чипсы из рисовой бумаги, соус манго-маракуйя.", weight: "270 г", price: 890, ingredients: ["тигровые креветки","мидии","кальмары","авокадо","апельсины","микс салат","чипсы из рисовой бумаги","соус манго-маракуйя"] }),
  item({ id: "summer-panzanella-salad", category: "summer", name: "Салат Панцанелла", description: "томаты, огурцы, микс салат, оливки, маслины, лук красный, сыр пармезан, соус песто, масло оливковое, чиабатта.", weight: "280 г", price: 490, oldPrice: 540, ingredients: ["томаты","огурцы","микс салат","оливки","маслины","лук красный","сыр пармезан","соус песто","масло оливковое","чиабатта"] }),
  item({ id: "summer-chicken-pear-salad", category: "summer", name: "Салат с курицей, грушей и молодым сыром", description: "куриное филе, груши, сыр молодой, томаты, микс салат, оливки, маслины, сыр пармезан, соус песто.", weight: "280 г", price: 650, ingredients: ["куриное филе","груши","сыр молодой","томаты","микс салат","оливки","маслины","сыр пармезан","соус песто"] }),
  item({ id: "summer-okroshka-chicken-kefir", category: "summer", name: "Окрошка с курицей на кефире", description: "куриное филе, картофель печеный, огурцы, редис, яйцо перепелиное, лук зеленый, зелень, кефир.", weight: "400/40 г", price: 420, ingredients: ["куриное филе","картофель печеный","огурцы","редис","яйцо перепелиное","лук зеленый","зелень","кефир"] }),
  item({ id: "summer-okroshka-beef-kvass", category: "summer", name: "Окрошка с говядиной на квасе", description: "говядина, картофель печеный, огурцы, редис, яйцо перепелиное, лук зеленый, зелень, хрен, горчица, квас.", weight: "380/30/40 г", price: 560, ingredients: ["говядина","картофель печеный","огурцы","редис","яйцо перепелиное","лук зеленый","зелень","хрен","горчица","квас"] }),
  item({ id: "summer-tuna-poke", category: "summer", name: "Поке с тунцом", description: "филе тунца, авокадо, огурцы, редис, лук зеленый, рис басмати, кинза, соус азиатский.", weight: "260 г", price: 620, ingredients: ["филе тунца","авокадо","огурцы","редис","лук зеленый","рис басмати","кинза","соус азиатский"] }),
  item({ id: "summer-green-buckwheat-bowl", category: "summer", name: "Боул с зеленой гречкой", description: "говядина, гречка зеленая, авокадо, огурцы, томаты черри, микс салат, яйцо куриное, сыр пармезан, соус йогуртовый с авокадо, соус чимичурри.", weight: "290 г", price: 560, ingredients: ["говядина","гречка зеленая","авокадо","огурцы","томаты черри","микс салат","яйцо куриное","сыр пармезан","соус йогуртовый с авокадо","соус чимичурри"] }),
  item({ id: "summer-beef-flatbread", category: "summer", name: "Итальянская лепешка с говядиной", description: "говядина, томаты, микс салат, сыр пармезан, соус Вителло, лепешка пшеничная.", weight: "260 г", price: 490, ingredients: ["говядина","томаты","микс салат","сыр пармезан","соус Вителло","лепешка пшеничная"] }),
  item({ id: "summer-shrimp-flatbread", category: "summer", name: "Итальянская лепешка с креветками", description: "креветки тигровые, томаты, огурцы, микс салат, кинза, соус азиатский, соус терияки.", weight: "270 г", price: 460, ingredients: ["креветки тигровые","томаты","огурцы","микс салат","кинза","соус азиатский","соус терияки"] }),
  item({ id: "summer-strawberry-soup", category: "summer", name: "Клубничный суп с мороженым", description: "клубника, апельсин, банан, мороженое пломбир, мята.", weight: "300/50 г", price: 490, ingredients: ["клубника","апельсин","банан","мороженое пломбир","мята"] }),
  item({ id: "summer-mojito-lemonade", category: "summer", name: "Лимонад Мохито безалкогольный", description: "лайм, мята, сахарный сироп, газированная вода, лед по желанию.", weight: "1 л", price: 650, ingredients: ["лайм","мята","сахарный сироп","газированная вода","лед"] }),
  item({ id: "breakfast-sytnyy-zavtrak-270-g", category: "breakfast", name: "Сытный завтрак", description: "глазунья, колбаска мюнхенская, бекон, шампиньоны, микс салат, чиабатта.", weight: "270 г", price: 590, ingredients: ["глазунья","колбаска мюнхенская","бекон","шампиньоны","микс салат","чиабатта"] }),
  item({ id: "breakfast-poleznyy-zavtrak-280-g", category: "breakfast", name: "Полезный завтрак", description: "омлет, лосось, авокадо, огурцы, микс салат, чиабатта, сливочно-творожный крем.", weight: "280 г", price: 690, ingredients: ["омлет","лосось","авокадо","огурцы","микс салат","чиабатта","сливочно-творожный крем"] }),
  item({ id: "breakfast-kukuruznaya-kasha-230-g", category: "breakfast", name: "Кукурузная каша", description: "с креветками, яйцом пашот и песто.", weight: "230 г", price: 410, ingredients: ["креветки","яйцо пашот","песто"] }),
  item({ id: "breakfast-monastyrskiy-gerkules-310-g", category: "breakfast", name: "Монастырский геркулес", description: "с вялеными томатами, окороком и яйцом адзитама.", weight: "310 г", price: 350, ingredients: ["вяленые томаты","окорок","яйцо адзитама"] }),
  item({ id: "breakfast-slivochnoe-psheno-250-g", category: "breakfast", name: "Сливочное пшено", description: "с сезонными ягодами и овсяным печеньем.", weight: "250 г", price: 320, ingredients: ["сезонные ягоды","овсяное печенье"] }),
  item({ id: "breakfast-risovaya-kasha-210-50-g", category: "breakfast", name: "Рисовая каша", description: "с манго и маракуйей.", weight: "210/50 г", price: 280, ingredients: ["манго","маракуйя"] }),
  item({ id: "breakfast-shakshuka-230-30-g", category: "breakfast", name: "Шакшука", description: "с пшеничными тостами.", weight: "230/30 г", price: 340, ingredients: ["пшеничные тосты"] }),
  item({ id: "breakfast-glazunya-150-70-g", category: "breakfast", name: "Глазунья", description: "с микс салатом и тостами со сливочным кремом.", weight: "150/70 г", price: 350, ingredients: ["микс салат","тосты со сливочным кремом"] }),
  item({ id: "breakfast-borodinskie-tosty-260-g", category: "breakfast", name: "Бородинские тосты", description: "с окороком и яйцом.", weight: "260 г", price: 390, ingredients: ["окорок","яйцо"] }),
  item({ id: "breakfast-draniki-kartofelnye-230-g", category: "breakfast", name: "Драники картофельные", description: "с курицей, глазуньей и овощным салатом.", weight: "230 г", price: 590, ingredients: ["курица","глазунья","овощной салат"] }),
  item({ id: "breakfast-bliny-s-myasom-230-40-g", category: "breakfast", name: "Блины с мясом", description: "с мясом и сметаной.", weight: "230/40 г", price: 490, ingredients: ["мясо","сметана"] }),
  item({ id: "breakfast-bliny-s-yagodnym-sousom-120-40-g", category: "breakfast", name: "Блины с ягодным соусом", description: "блины с ягодным соусом.", weight: "120/40 г", price: 290, ingredients: ["блины с ягодным соусом"] }),
  item({ id: "breakfast-syrniki-s-yagodami-210-g", category: "breakfast", name: "Сырники с ягодами", description: "с ягодами и солёной карамелью.", weight: "210 г", price: 260, ingredients: ["ягоды","солёная карамель"] }),
  item({ id: "breakfast-tvorozhnaya-zapekanka-220-40-g", category: "breakfast", name: "Творожная запеканка", description: "с ягодным соусом и кремом муслин.", weight: "220/40 г", price: 360, ingredients: ["ягодный соус","крем муслин"] }),
  item({ id: "breakfast-addon-krevetki-3-sht", category: "breakfast-addon", name: "Креветки", description: "креветки.", weight: "3 шт.", price: 270, ingredients: ["креветки"] }),
  item({ id: "breakfast-addon-losos-s-s-40-g", category: "breakfast-addon", name: "Лосось с/с", description: "слабосолёный лосось.", weight: "40 г", price: 370, ingredients: ["слабосолёный лосось"] }),
  item({ id: "breakfast-addon-avokado-50-g", category: "breakfast-addon", name: "Авокадо", description: "авокадо.", weight: "50 г", price: 150, ingredients: ["авокадо"] }),
  item({ id: "breakfast-addon-smetana-30-g", category: "breakfast-addon", name: "Сметана", description: "сметана.", weight: "30 г", price: 70, ingredients: ["сметана"] }),
  item({ id: "breakfast-addon-med-30-g", category: "breakfast-addon", name: "Мёд", description: "мёд.", weight: "30 г", price: 70, ingredients: ["мёд"] }),
  item({ id: "breakfast-addon-sguschennoe-moloko-30-g", category: "breakfast-addon", name: "Сгущённое молоко", description: "сгущённое молоко.", weight: "30 г", price: 50, ingredients: ["сгущённое молоко"] }),
  item({ id: "breakfast-addon-varene-v-assortimente-30-g", category: "breakfast-addon", name: "Варенье в ассортименте", description: "варенье в ассортименте.", weight: "30 г", price: 70, ingredients: ["варенье в ассортименте"] }),
  item({ id: "kids-krem-sup-iz-kurochki-240-20-g", category: "kids", name: "Крем-суп из курочки", description: "крем-суп из курочки.", weight: "240/20 г", price: 370, ingredients: ["крем-суп из курочки"] }),
  item({ id: "kids-kurinyy-bulon-s-lapshoy-i-frikadelkami-280-g", category: "kids", name: "Куриный бульон с лапшой и фрикадельками", description: "куриный бульон с лапшой и фрикадельками.", weight: "280 г", price: 320, ingredients: ["куриный бульон с лапшой","фрикадельки"] }),
  item({ id: "kids-naggetsy-250-40-g", category: "kids", name: "Наггетсы", description: "с картофелем фри и сырным соусом.", weight: "250/40 г", price: 470, ingredients: ["картофель фри","сырный соус"] }),
  item({ id: "kids-pelmeni-domashnie-160-30-g", category: "kids", name: "Пельмени домашние", description: "со сметаной.", weight: "160/30 г", price: 290, ingredients: ["сметана"] }),
  item({ id: "kids-kurinye-kotletki-275-g", category: "kids", name: "Куриные котлетки", description: "с картофельным пюре.", weight: "275 г", price: 390, ingredients: ["картофельное пюре"] }),
  item({ id: "kids-pasta-s-syrom-i-frikadelkami-210-g", category: "kids", name: "Паста с сыром и фрикадельками", description: "паста с сыром и фрикадельками.", weight: "210 г", price: 390, ingredients: ["паста с сыром","фрикадельки"] }),
  item({ id: "kids-forel-zapechennaya-160-g", category: "kids", name: "Форель запечённая", description: "с рисом.", weight: "160 г", price: 550, ingredients: ["рис"] }),
  item({ id: "kids-margarita-pizza", category: "kids", name: "Пицца детская Маргарита", description: "моцарелла, томаты черри, маслины, болгарский перец, соус томатный.", weight: "400 г", price: 450, ingredients: ["моцарелла","томаты черри","маслины","болгарский перец","соус томатный"] }),
  item({ id: "kids-ham-pizza", category: "kids", name: "Пицца детская с ветчиной", description: "ветчина, моцарелла, томаты черри, маслины, болгарский перец, соус томатный.", weight: "380 г", price: 480, ingredients: ["ветчина","моцарелла","томаты черри","маслины","болгарский перец","соус томатный"] }),
  item({ id: "kids-chicken-pizza", category: "kids", name: "Пицца детская с курочкой", description: "куриное филе, моцарелла, томаты черри, болгарский перец, маслины, сливочный соус.", weight: "420 г", price: 550, ingredients: ["куриное филе","моцарелла","томаты черри","болгарский перец","маслины","сливочный соус"] }),
  item({ id: "soup-borsch-250-50-30-g", category: "soup", name: "Борщ", description: "с домашним салом и сметаной.", weight: "250/50/30 г", price: 490, ingredients: ["домашнее сало","сметана"] }),
  item({ id: "soup-sup-kurinyy-320-g", category: "soup", name: "Суп куриный", description: "с домашней лапшой.", weight: "320 г", price: 320, ingredients: ["домашняя лапша"] }),
  item({ id: "soup-krem-sup-iz-shampinonov-300-20-g", category: "soup", name: "Крем-суп из шампиньонов", description: "крем-суп из шампиньонов.", weight: "300/20 г", price: 390, ingredients: ["крем-суп из шампиньонов"] }),
  item({ id: "soup-tom-yam-420-g", category: "soup", name: "Том ям", description: "том ям.", weight: "420 г", price: 870, ingredients: ["том ям"] }),
  item({ id: "soup-zelenye-schi-400-30-g", category: "soup", name: "Зелёные щи", description: "с клёцками и сметаной.", weight: "400/30 г", price: 460, ingredients: ["клёцки","сметана"] }),
  item({ id: "main-svinye-rebryshki-480-g", category: "main", name: "Свиные рёбрышки", description: "с картофелем фри и соусом барбекю.", weight: "480 г", price: 990, ingredients: ["картофель фри","соус барбекю"] }),
  item({ id: "main-steyk-ossobuko-260-120-50-g", category: "main", name: "Стейк оссобуко", description: "на выбор овощи гриль или картофель фри, с соусом барбекю.", weight: "260/120/50 г", price: 990, ingredients: ["на выбор овощи гриль или картофель фри","соус барбекю"] }),
  item({ id: "main-steyk-file-minon-230-g", category: "main", name: "Стейк филе миньон", description: "с брокколи и перечным соусом.", weight: "230 г", price: 1190, ingredients: ["брокколи","перечный соус"] }),
  item({ id: "main-telyachi-schechki-310-g", category: "main", name: "Телячьи щёчки", description: "с картофельным пюре, томатами черри и облепиховым соусом.", weight: "310 г", price: 840, ingredients: ["картофельное пюре","томаты черри","облепиховый соус"] }),
  item({ id: "main-steyk-iz-foreli-280-g", category: "main", name: "Стейк из форели", description: "с брокколи и апельсиновым соусом.", weight: "280 г", price: 990, ingredients: ["брокколи","апельсиновый соус"] }),
  item({ id: "main-rublenaya-kotleta-270-g", category: "main", name: "Рубленая котлета", description: "из лосося и трески, с киноа и гуакамоле.", weight: "270 г", price: 960, ingredients: ["лосось","треска","киноа","гуакамоле"] }),
  item({ id: "main-rulet-iz-indeyki-330-g", category: "main", name: "Рулет из индейки", description: "с пюре из сельдерея и грибным соусом.", weight: "330 г", price: 780, ingredients: ["пюре из сельдерея","грибной соус"] }),
  item({ id: "main-steyk-iz-kurinogo-file-330-g", category: "main", name: "Стейк из куриного филе", description: "с овощами.", weight: "330 г", price: 650, ingredients: ["овощи"] }),
  item({ id: "main-burger-s-kotletoy-iz-govyadiny-300-g", category: "main", name: "Бургер с котлетой из говядины", description: "котлета из говядины, бекон, салат айсберг, солёный огурец, глазунья, соус сырный и соус тонато.", weight: "300 г", price: 590, ingredients: ["котлета из говядины","бекон","салат айсберг","солёный огурец","глазунья","соус сырный","соус тонато"] }),
  item({ id: "main-burger-s-kotletoy-iz-kuricy-300-g", category: "main", name: "Бургер с котлетой из курицы", description: "куриная котлета, салат айсберг, томаты, солёный огурец, глазунья, соус сырный и соус тонато.", weight: "300 г", price: 490, ingredients: ["куриная котлета","салат айсберг","томаты","солёный огурец","глазунья","соус сырный","соус тонато"] }),
  item({ id: "pasta-karbonara-310-g", category: "pasta", name: "Карбонара", description: "карбонара.", weight: "310 г", price: 550, ingredients: ["карбонара"] }),
  item({ id: "pasta-pasta-s-vyalenymi-tomatami-i-pesto-265-g", category: "pasta", name: "Паста с вялеными томатами и песто", description: "паста с вялеными томатами и песто.", weight: "265 г", price: 540, ingredients: ["паста с вялеными томатами","песто"] }),
  item({ id: "pasta-pasta-s-forelyu-310-g", category: "pasta", name: "Паста с форелью", description: "паста с форелью.", weight: "310 г", price: 740, ingredients: ["паста с форелью"] }),
  item({ id: "pasta-lapsha-domashnyaya-s-govyadinoy-340-g", category: "pasta", name: "Лапша домашняя с говядиной", description: "домашняя лапша с говядиной.", weight: "340 г", price: 760, ingredients: ["домашняя лапша с говядиной"] }),
  item({ id: "pasta-lapsha-domashnyaya-s-kuricey-i-gribami-340-g", category: "pasta", name: "Лапша домашняя с курицей и грибами", description: "домашняя лапша с курицей и грибами.", weight: "340 г", price: 510, ingredients: ["домашняя лапша с курицей","грибы"] }),
  item({ id: "pasta-lapsha-domashnyaya-s-krevetkami-400-g", category: "pasta", name: "Лапша домашняя с креветками", description: "домашняя лапша с креветками.", weight: "400 г", price: 690, ingredients: ["домашняя лапша с креветками"] }),
  item({ id: "pasta-chernaya-pasta-s-moreproduktami-310-g", category: "pasta", name: "Чёрная паста с морепродуктами", description: "чёрная паста с морепродуктами.", weight: "310 г", price: 870, ingredients: ["чёрная паста с морепродуктами"] }),
  item({ id: "pasta-nokki-s-lososem-330-g", category: "pasta", name: "Ньокки с лососем", description: "ньокки с лососем.", weight: "330 г", price: 750, ingredients: ["ньокки с лососем"] }),
  item({ id: "salad-cezar-220-g", category: "salad", name: "Цезарь", description: "куриное филе, яйцо перепелиное, пармезан, романо, айсберг, томаты черри, соус цезарь, пшеничные сухарики.", weight: "220 г", price: 470, ingredients: ["куриное филе","яйцо перепелиное","пармезан","романо","айсберг","томаты черри","соус цезарь","пшеничные сухарики"] }),
  item({ id: "salad-hrustyaschiy-baklazhan-280-g", category: "salad", name: "Хрустящий баклажан", description: "баклажаны, творожный сыр, огурцы, томаты, арахис, соус свит чили.", weight: "280 г", price: 490, ingredients: ["баклажаны","творожный сыр","огурцы","томаты","арахис","соус свит чили"] }),
  item({ id: "salad-olive-s-govyadinoy-210-g", category: "salad", name: "Оливье с говядиной", description: "говядина, яйцо перепелиное, авокадо, морковь, зелёный горошек.", weight: "210 г", price: 560, ingredients: ["говядина","яйцо перепелиное","авокадо","морковь","зелёный горошек"] }),
  item({ id: "salad-zelenyy-salat-280-g", category: "salad", name: "Зелёный салат", description: "авокадо, брокколи, томаты черри, огурцы, редис, кабачки, бобы эдамаме, микс салат, гуакамоле, соус песто с кешью.", weight: "280 г", price: 660, ingredients: ["авокадо","брокколи","томаты черри","огурцы","редис","кабачки","бобы эдамаме","микс салат"] }),
  item({ id: "salad-nisuaz-270-g", category: "salad", name: "Нисуаз", description: "тунец, яйцо куриное, картофель, микс салат, томаты черри.", weight: "270 г", price: 790, ingredients: ["тунец","яйцо куриное","картофель","микс салат","томаты черри"] }),
  item({ id: "salad-salat-s-lososem-220-g", category: "salad", name: "Салат с лососем", description: "лосось, авокадо, микс салат, апельсин, томаты черри, йогуртовый соус с авокадо.", weight: "220 г", price: 790, ingredients: ["лосось","авокадо","микс салат","апельсин","томаты черри","йогуртовый соус с авокадо"] }),
  item({ id: "salad-salat-s-indeykoy-i-persikami-gril-230-g", category: "salad", name: "Салат с индейкой и персиками гриль", description: "индейка, персики, микс салат, томаты черри, сыр пармезан, медово-горчичный соус.", weight: "230 г", price: 590, ingredients: ["индейка","персики","микс салат","томаты черри","сыр пармезан","медово-горчичный соус"] }),
  item({ id: "salad-teplyy-salat-iz-telyatiny-240-g", category: "salad", name: "Тёплый салат из телятины", description: "телятина, брокколи, цветная капуста, томаты черри, яйцо перепелиное, микс салат, оливковое масло.", weight: "240 г", price: 640, ingredients: ["телятина","брокколи","цветная капуста","томаты черри","яйцо перепелиное","микс салат","оливковое масло"] }),
  item({ id: "starter-medovyy-pashtet-iz-pecheni-cyplenka-220-30-g", category: "starter", name: "Медовый паштет из печени цыплёнка", description: "с бруснично-айвовым соусом.", weight: "220/30 г", price: 450, ingredients: ["бруснично-айвовый соус"] }),
  item({ id: "starter-tar-tar-iz-govyadiny-190-35-g", category: "starter", name: "Тар тар из говядины", description: "с пармезаном и пюре из зелёного горошка.", weight: "190/35 г", price: 670, ingredients: ["пармезан","пюре из зелёного горошка"] }),
  item({ id: "starter-tar-tar-iz-tunca-210-g", category: "starter", name: "Тар тар из тунца", description: "со свежими овощами, рисовыми чипсами и тайским соусом.", weight: "210 г", price: 720, ingredients: ["свежие овощи","рисовые чипсы","тайский соус"] }),
  item({ id: "starter-krevetki-panko-160-50-g", category: "starter", name: "Креветки панко", description: "креветки панко.", weight: "160/50 г", price: 650, ingredients: ["креветки панко"] }),
  item({ id: "starter-zharenyy-syr-suluguni-180-30-g", category: "starter", name: "Жареный сыр сулугуни", description: "с брусничным соусом.", weight: "180/30 г", price: 650, ingredients: ["брусничный соус"] }),
  item({ id: "starter-syrnaya-doska-120-80-g", category: "starter", name: "Сырная доска", description: "дор блю, камамбер, маасдам и молодой сыр.", weight: "120/80 г", price: 790, ingredients: ["дор блю","камамбер","маасдам","молодой сыр"] }),
  item({ id: "starter-ovoschnaya-doska-290-40-g", category: "starter", name: "Овощная доска", description: "свежие томаты, огурцы, сладкий перец, редис и зелень.", weight: "290/40 г", price: 490, ingredients: ["свежие томаты","огурцы","сладкий перец","редис","зелень"] }),
  item({ id: "dumplings-pelmeni-200-30-g", category: "dumplings", name: "Пельмени", description: "с говядиной и свининой.", weight: "200/30 г", price: 390, ingredients: ["говядина","свинина"] }),
  item({ id: "dumplings-vareniki-s-tvorogom-180-30-g", category: "dumplings", name: "Вареники с творогом", description: "вареники с творогом.", weight: "180/30 г", price: 360, ingredients: ["вареники с творогом"] }),
  item({ id: "dumplings-vareniki-s-kartofelem-i-gribami-200-g", category: "dumplings", name: "Вареники с картофелем и грибами", description: "вареники с картофелем и грибами.", weight: "200 г", price: 360, ingredients: ["вареники с картофелем","грибы"] }),
  item({ id: "waffle-venskaya-vaflya-115-50-g", category: "waffle", name: "Венская вафля", description: "с шоколадной пастой, мороженым и сезонными ягодами.", weight: "115/50 г", price: 390, ingredients: ["шоколадная паста","мороженое","сезонные ягоды"] }),
  item({ id: "waffle-kartofelnye-vafli-270-g", category: "waffle", name: "Картофельные вафли", description: "с лососем и яйцом пашот.", weight: "270 г", price: 690, ingredients: ["лосось","яйцо пашот"] }),
  item({ id: "waffle-vafli-iz-brokkoli-260-g", category: "waffle", name: "Вафли из брокколи", description: "с лососем.", weight: "260 г", price: 650, ingredients: ["лосось"] }),
  item({ id: "side-ovoschi-gril-150-g", category: "side", name: "Овощи гриль", description: "с грибами.", weight: "150 г", price: 290, ingredients: ["грибы"] }),
  item({ id: "side-ris-basmatti-150-g", category: "side", name: "Рис басматти", description: "рис басматти.", weight: "150 г", price: 190, ingredients: ["рис басматти"] }),
  item({ id: "side-kartofel-fri-100-g", category: "side", name: "Картофель фри", description: "картофель фри.", weight: "100 г", price: 190, ingredients: ["картофель фри"] }),
  item({ id: "side-kartofel-po-derevenski-150-g", category: "side", name: "Картофель по-деревенски", description: "картофель по-деревенски.", weight: "150 г", price: 190, ingredients: ["картофель по-деревенски"] }),
  item({ id: "side-parovye-ovoschi-150-g", category: "side", name: "Паровые овощи", description: "паровые овощи.", weight: "150 г", price: 190, ingredients: ["паровые овощи"] }),
  item({ id: "parmesan-focaccia", category: "bread", name: "Фокачча с пармезаном", description: "фокачча с пармезаном.", weight: "220 г", price: 260, ingredients: ["фокачча с пармезаном"] }),
  item({ id: "garlic-oregano-focaccia", category: "bread", name: "Фокачча с чесноком и орегано", description: "фокачча с чесноком и орегано.", weight: "220 г", price: 190, ingredients: ["фокачча с чесноком","орегано"] }),
  item({ id: "bread-hlebnaya-korzinka-240-g", category: "bread", name: "Хлебная корзинка", description: "хлебная корзинка.", weight: "240 г", price: 300, ingredients: ["хлебная корзинка"] }),
  item({ id: "bread-hleb-30-g", category: "bread", name: "Хлеб", description: "хлеб.", weight: "30 г", price: 40, ingredients: ["хлеб"] }),
  item({ id: "dessert-esterhazi", category: "dessert", name: "Эстерхази", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-smuglyanka", category: "dessert", name: "Смуглянка", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-brauni", category: "dessert", name: "Брауни", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-molochnaya-devochka", category: "dessert", name: "Молочная девочка", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-medovik", category: "dessert", name: "Медовик", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-zavarnoe-kolco", category: "dessert", name: "Заварное кольцо", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-ptiche-moloko", category: "dessert", name: "Птичье молоко", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-napoleon", category: "dessert", name: "Наполеон", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-detskoe-eskimo", category: "dessert", name: "Детское эскимо", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "dessert-deserty-v-assortimente", category: "dessert", name: "Десерты в ассортименте", description: "скоро добавим сюда состав.", weight: "", price: 120, ingredients: ["скоро добавим сюда состав"] }),
  item({ id: "drink-firmennyy-chay-oblepihovo-bananovyy-s-bazilikom-200-300-ml", category: "drink", name: "Фирменный чай: облепихово-банановый с базиликом", description: "облепихово-банановый чай с базиликом.", weight: "200/300 мл", price: 390, ingredients: ["облепихово-банановый чай с базиликом"] }),
  item({ id: "drink-firmennyy-chay-sagan-daylya-s-persikom-200-300-ml", category: "drink", name: "Фирменный чай: саган-дайля с персиком", description: "саган-дайля с персиком.", weight: "200/300 мл", price: 390, ingredients: ["саган-дайля с персиком"] }),
  item({ id: "drink-firmennyy-chay-pryanaya-smorodina-200-300-ml", category: "drink", name: "Фирменный чай: пряная смородина", description: "пряная смородина.", weight: "200/300 мл", price: 390, ingredients: ["пряная смородина"] }),
  item({ id: "drink-firmennyy-chay-apelsin-vishnya-i-smorodina-200-300-ml", category: "drink", name: "Фирменный чай: апельсин, вишня и смородина", description: "апельсин, вишня и смородина.", weight: "200/300 мл", price: 390, ingredients: ["апельсин","вишня","смородина"] }),
  item({ id: "drink-firmennyy-chay-chernika-s-bazilikom-200-300-ml", category: "drink", name: "Фирменный чай: черника с базиликом", description: "черника с базиликом.", weight: "200/300 мл", price: 390, ingredients: ["черника с базиликом"] }),
  item({ id: "drink-firmennyy-chay-molochnyy-ulun-ananas-i-vanil-200-300-ml", category: "drink", name: "Фирменный чай: молочный улун «ананас и ваниль»", description: "молочный улун «ананас и ваниль».", weight: "200/300 мл", price: 390, ingredients: ["молочный улун «ананас и ваниль»"] }),
  item({ id: "drink-klassicheskiy-chay-assam-s-medom-200-300-ml", category: "drink", name: "Классический чай: ассам с мёдом", description: "ассам с мёдом.", weight: "200/300 мл", price: 320, ingredients: ["ассам с мёдом"] }),
  item({ id: "drink-klassicheskiy-chay-roybush-200-300-ml", category: "drink", name: "Классический чай: ройбуш", description: "ройбуш.", weight: "200/300 мл", price: 320, ingredients: ["ройбуш"] }),
  item({ id: "drink-klassicheskiy-chay-chernyy-chay-s-bergamotom-200-300-ml", category: "drink", name: "Классический чай: чёрный чай с бергамотом", description: "чёрный чай с бергамотом.", weight: "200/300 мл", price: 320, ingredients: ["чёрный чай с бергамотом"] }),
  item({ id: "drink-klassicheskiy-chay-chernyy-chay-s-chabrecom-200-300-ml", category: "drink", name: "Классический чай: чёрный чай с чабрецом", description: "чёрный чай с чабрецом.", weight: "200/300 мл", price: 320, ingredients: ["чёрный чай с чабрецом"] }),
  item({ id: "drink-klassicheskiy-chay-molochnyy-ulun-200-300-ml", category: "drink", name: "Классический чай: молочный улун", description: "молочный улун.", weight: "200/300 мл", price: 320, ingredients: ["молочный улун"] }),
  item({ id: "drink-klassicheskiy-chay-sencha-s-medom-200-300-ml", category: "drink", name: "Классический чай: сенча с мёдом", description: "сенча с мёдом.", weight: "200/300 мл", price: 320, ingredients: ["сенча с мёдом"] }),
  item({ id: "drink-klassicheskiy-chay-zhasmin-200-300-ml", category: "drink", name: "Классический чай: жасмин", description: "жасмин.", weight: "200/300 мл", price: 320, ingredients: ["жасмин"] }),
  item({ id: "drink-klassicheskiy-chay-grechishnyy-200-300-ml", category: "drink", name: "Классический чай: гречишный", description: "гречишный чай.", weight: "200/300 мл", price: 320, ingredients: ["гречишный чай"] }),
  item({ id: "drink-klassicheskiy-chay-nahalnyy-frukt-200-300-ml", category: "drink", name: "Классический чай: «нахальный фрукт»", description: "фруктовый чай «нахальный фрукт».", weight: "200/300 мл", price: 320, ingredients: ["фруктовый чай «нахальный фрукт»"] }),
  item({ id: "drink-klassicheskiy-chay-ivan-chay-200-300-ml", category: "drink", name: "Классический чай: иван-чай", description: "иван-чай.", weight: "200/300 мл", price: 320, ingredients: ["иван-чай"] }),
  item({ id: "drink-klassicheskiy-chay-sagan-daylya-200-300-ml", category: "drink", name: "Классический чай: саган-дайля", description: "саган-дайля.", weight: "200/300 мл", price: 320, ingredients: ["саган-дайля"] }),
  item({ id: "drink-dobavka-k-chayu-limon-myata", category: "drink", name: "Добавка к чаю: лимон / мята", description: "лимон или мята.", weight: "", price: 60, ingredients: ["лимон или мята"] }),
  item({ id: "drink-espresso-40-ml", category: "drink", name: "Эспрессо", description: "кофе эспрессо.", weight: "40 мл", price: 120, ingredients: ["кофе эспрессо"] }),
  item({ id: "drink-kapuchino-200-ml", category: "drink", name: "Капучино", description: "кофе капучино.", weight: "200 мл", price: 220, ingredients: ["кофе капучино"] }),
  item({ id: "drink-dvoynoy-kapuchino-350-ml", category: "drink", name: "Двойной капучино", description: "двойной капучино.", weight: "350 мл", price: 260, ingredients: ["двойной капучино"] }),
  item({ id: "drink-latte-250-ml", category: "drink", name: "Латте", description: "кофе латте.", weight: "250 мл", price: 220, ingredients: ["кофе латте"] }),
  item({ id: "drink-amerikano-250-ml", category: "drink", name: "Американо", description: "кофе американо.", weight: "250 мл", price: 140, ingredients: ["кофе американо"] }),
  item({ id: "drink-amerikano-350-ml", category: "drink", name: "Американо", description: "кофе американо.", weight: "350 мл", price: 180, ingredients: ["кофе американо"] }),
  item({ id: "drink-flet-uayt-300-ml", category: "drink", name: "Флэт-уайт", description: "кофе флэт-уайт.", weight: "300 мл", price: 260, ingredients: ["кофе флэт-уайт"] }),
  item({ id: "drink-raf-s-siropom-na-vybor-200-ml", category: "drink", name: "Раф с сиропом на выбор", description: "раф с сиропом на выбор.", weight: "200 мл", price: 240, ingredients: ["раф с сиропом на выбор"] }),
  item({ id: "drink-raf-s-siropom-na-vybor-350-ml", category: "drink", name: "Раф с сиропом на выбор", description: "раф с сиропом на выбор.", weight: "350 мл", price: 270, ingredients: ["раф с сиропом на выбор"] }),
  item({ id: "drink-kakao-200-ml", category: "drink", name: "Какао", description: "какао.", weight: "200 мл", price: 240, ingredients: ["какао"] }),
  item({ id: "drink-fresh-greypfrut-250-ml", category: "drink", name: "Фреш грейпфрут", description: "грейпфрут.", weight: "250 мл", price: 390, ingredients: ["грейпфрут"] }),
  item({ id: "drink-fresh-yabloko-250-ml", category: "drink", name: "Фреш яблоко", description: "яблоко.", weight: "250 мл", price: 290, ingredients: ["яблоко"] }),
  item({ id: "drink-fresh-apelsin-250-ml", category: "drink", name: "Фреш апельсин", description: "апельсин.", weight: "250 мл", price: 290, ingredients: ["апельсин"] }),
  item({ id: "drink-fresh-morkov-selderey-yabloko-250-ml", category: "drink", name: "Фреш морковь, сельдерей, яблоко", description: "морковь, сельдерей, яблоко.", weight: "250 мл", price: 320, ingredients: ["морковь","сельдерей","яблоко"] }),
  item({ id: "drink-fresh-morkov-so-slivkami-250-ml", category: "drink", name: "Фреш морковь со сливками", description: "морковь со сливками.", weight: "250 мл", price: 320, ingredients: ["морковь со сливками"] }),
  item({ id: "drink-smuzi-malina-chernika-imbir-300-ml", category: "drink", name: "Смузи «малина, черника, имбирь»", description: "малина, черника, имбирь.", weight: "300 мл", price: 390, ingredients: ["малина","черника","имбирь"] }),
  item({ id: "drink-tropicheskiy-smuzi-300-ml", category: "drink", name: "Тропический смузи", description: "тропический смузи.", weight: "300 мл", price: 390, ingredients: ["тропический смузи"] }),
  item({ id: "drink-smuzi-mango-grusha-avokado-300-ml", category: "drink", name: "Смузи «манго, груша, авокадо»", description: "манго, груша, авокадо.", weight: "300 мл", price: 390, ingredients: ["манго","груша","авокадо"] }),
  item({ id: "drink-smuzi-selderey-shpinat-yabloko-300-ml", category: "drink", name: "Смузи «сельдерей, шпинат, яблоко»", description: "сельдерей, шпинат, яблоко.", weight: "300 мл", price: 390, ingredients: ["сельдерей","шпинат","яблоко"] }),
  item({ id: "drink-milksheyk-ananas-i-kokos-300-ml", category: "drink", name: "Милкшейк «ананас и кокос»", description: "ананас и кокос.", weight: "300 мл", price: 390, ingredients: ["ананас","кокос"] }),
  item({ id: "drink-milksheyk-vishnya-i-malina-300-ml", category: "drink", name: "Милкшейк «вишня и малина»", description: "вишня и малина.", weight: "300 мл", price: 390, ingredients: ["вишня","малина"] }),
  item({ id: "drink-milksheyk-persik-i-banan-300-ml", category: "drink", name: "Милкшейк «персик и банан»", description: "персик и банан.", weight: "300 мл", price: 390, ingredients: ["персик","банан"] }),
  item({ id: "drink-tayskiy-milksheyk-300-ml", category: "drink", name: "Тайский милкшейк", description: "тайский милкшейк.", weight: "300 мл", price: 390, ingredients: ["тайский милкшейк"] }),
  item({ id: "drink-shokoladnyy-milksheyk-300-ml", category: "drink", name: "Шоколадный милкшейк", description: "шоколадный милкшейк.", weight: "300 мл", price: 390, ingredients: ["шоколадный милкшейк"] }),
  item({ id: "drink-limonad-ananas-s-bananom-i-buzinoy-300-ml", category: "drink", name: "Лимонад «ананас с бананом и бузиной»", description: "ананас, банан, бузина.", weight: "300 мл", price: 350, ingredients: ["ананас","банан","бузина"] }),
  item({ id: "drink-limonad-mohito-300-ml", category: "drink", name: "Лимонад «мохито»", description: "мохито.", weight: "300 мл", price: 350, ingredients: ["мохито"] }),
  item({ id: "drink-limonad-vishnya-i-citrus-300-ml", category: "drink", name: "Лимонад «вишня и цитрус»", description: "вишня и цитрус.", weight: "300 мл", price: 350, ingredients: ["вишня","цитрус"] }),
  item({ id: "drink-altayskiy-limonad-s-oblepihoy-i-imbirem-300-ml", category: "drink", name: "Алтайский лимонад с облепихой и имбирём", description: "облепиха и имбирь.", weight: "300 мл", price: 350, ingredients: ["облепиха","имбирь"] }),
  item({ id: "drink-limonad-marakuyya-s-persikom-i-tarhunom-300-ml", category: "drink", name: "Лимонад «маракуйя с персиком и тархуном»", description: "маракуйя, персик, тархун.", weight: "300 мл", price: 350, ingredients: ["маракуйя","персик","тархун"] }),
  item({ id: "drink-limonad-klubnika-s-mango-i-bazilikom-300-ml", category: "drink", name: "Лимонад «клубника с манго и базиликом»", description: "клубника, манго, базилик.", weight: "300 мл", price: 350, ingredients: ["клубника","манго","базилик"] }),
  item({ id: "drink-mors-250-ml", category: "drink", name: "Морс", description: "морс.", weight: "250 мл", price: 130, ingredients: ["морс"] }),
  item({ id: "drink-sok-250-ml", category: "drink", name: "Сок", description: "сок.", weight: "250 мл", price: 130, ingredients: ["сок"] }),
  item({ id: "drink-mineralnaya-voda-gazirovannaya-500-ml", category: "drink", name: "Минеральная вода газированная", description: "минеральная вода газированная.", weight: "500 мл", price: 170, ingredients: ["минеральная вода газированная"] }),
  item({ id: "drink-mineralnaya-voda-negazirovannaya-500-ml", category: "drink", name: "Минеральная вода негазированная", description: "минеральная вода негазированная.", weight: "500 мл", price: 170, ingredients: ["минеральная вода негазированная"] }),
  item({ id: "drink-koka-kola-330-ml", category: "drink", name: "Кока-кола", description: "кока-кола.", weight: "330 мл", price: 250, ingredients: ["кока-кола"] })
];

export function getCategoryById(id) {
  return categoryMap[id] || null;
}

export function getProductById(id) {
  return MENU.find((item) => item.id === id) || null;
}

export function getUpsellProducts(limit = 4) {
  return MENU.filter((item) => item.category === "drink" || item.category === "dessert" || item.category === "starter").slice(0, limit);
}
