const pizzaImage = "/assets/pizza-main.webp";

export const PIZZA_ADDONS = [
  { id: "chicken", name: "Курица", price: 99 },
  { id: "mushrooms", name: "Грибы", price: 79 },
  { id: "jalapeno", name: "Халапеньо", price: 79 },
  { id: "mozzarella", name: "Моцарелла", price: 125 },
  { id: "parmesan", name: "Пармезан", price: 89 },
  { id: "tomatoes", name: "Томаты", price: 69 }
];

export const MENU = [
  {
    id: "pepperoni-honey",
    category: "pizza",
    name: "Пепперони с халапеньо и мёдом",
    description: "Остро-сладкая пицца с пепперони, халапеньо, мёдом и тягучей моцареллой.",
    price: 720,
    image: pizzaImage,
    badges: ["остро", "хит"],
    ingredients: ["пепперони", "халапеньо", "мёд", "моцарелла", "томатный соус"],
    featured: true
  },
  {
    id: "caesar",
    category: "pizza",
    name: "Пицца Цезарь",
    description: "Курица, томаты, сыр, фирменный соус и свежий салатный акцент.",
    price: 690,
    image: pizzaImage,
    badges: ["семейная"],
    ingredients: ["курица", "томаты", "моцарелла", "соус цезарь", "салат"],
    featured: true
  },
  {
    id: "carbonara",
    category: "pizza",
    name: "Пицца Карбонара",
    description: "Сливочная основа, бекон, сыр и мягкий итальянский вкус.",
    price: 710,
    image: pizzaImage,
    badges: ["сливочная"],
    ingredients: ["бекон", "сливочный соус", "моцарелла", "пармезан"]
  },
  {
    id: "four-cheese",
    category: "pizza",
    name: "Пицца Четыре сыра",
    description: "Моцарелла, пармезан, горгонзола и нежный сырный соус.",
    price: 740,
    image: pizzaImage,
    badges: ["сыр"],
    ingredients: ["моцарелла", "пармезан", "горгонзола", "сырный соус"]
  },
  {
    id: "margarita",
    category: "pizza",
    name: "Маргарита",
    description: "Томатный соус, моцарелла, базилик и румяный край.",
    price: 520,
    image: pizzaImage,
    badges: ["классика"],
    ingredients: ["томатный соус", "моцарелла", "базилик", "томаты"]
  },
  {
    id: "pear-gorgonzola",
    category: "pizza",
    name: "Пицца с грушей и горгонзолой",
    description: "Сладкая груша, горгонзола, нежная сырная основа и румяная корочка.",
    price: 830,
    image: pizzaImage,
    badges: ["новинка"],
    ingredients: ["груша", "горгонзола", "моцарелла", "сырный соус"],
    featured: true
  },
  {
    id: "chicken-tomato",
    category: "lunch",
    name: "Куриное филе с томатом",
    description: "Запечённое куриное филе с томатом, зеленью и тёплым гарниром.",
    price: 390,
    visual: "🍗",
    badges: ["обед"],
    ingredients: ["курица", "томат", "зелень"]
  },
  {
    id: "puree-chicken",
    category: "lunch",
    name: "Пюре с курицей",
    description: "Нежное картофельное пюре и сочная курица в домашнем стиле.",
    price: 420,
    visual: "🥔",
    badges: ["сытно"],
    ingredients: ["пюре", "курица", "сливочное масло"]
  },
  {
    id: "rice-vegetables",
    category: "lunch",
    name: "Рис с овощами",
    description: "Лёгкий горячий обед с рисом, овощами и ароматными специями.",
    price: 340,
    visual: "🍚",
    badges: ["лёгкое"],
    ingredients: ["рис", "овощи", "зелень"]
  },
  {
    id: "meat-mushrooms",
    category: "lunch",
    name: "Мясо с грибами",
    description: "Томлёное мясо с грибами и мягким сливочным соусом.",
    price: 470,
    visual: "🍄",
    badges: ["горячее"],
    ingredients: ["мясо", "грибы", "сливочный соус"]
  },
  {
    id: "bento-cake",
    category: "dessert",
    name: "Бенто-торт",
    description: "Маленький торт для повода, подарка или просто хорошего дня.",
    price: 690,
    visual: "🍰",
    badges: ["подарок"],
    ingredients: ["бисквит", "крем", "ягоды"],
    featured: true
  },
  {
    id: "cherry-chocolate",
    category: "dessert",
    name: "Вишня в шоколаде",
    description: "Нежная вишня в шоколадной глазури к кофе или чаю.",
    price: 325,
    visual: "🍒",
    badges: ["к кофе"],
    ingredients: ["вишня", "шоколад"]
  },
  {
    id: "cupcake",
    category: "dessert",
    name: "Капкейк",
    description: "Воздушный капкейк с кремовой шапочкой и сезонным декором.",
    price: 240,
    visual: "🧁",
    badges: ["детям"],
    ingredients: ["бисквит", "крем"]
  },
  {
    id: "meringue",
    category: "dessert",
    name: "Безе на палочке",
    description: "Хрустящее безе для детского праздника и сладкого настроения.",
    price: 160,
    visual: "🍭",
    badges: ["сладко"],
    ingredients: ["безе", "сахарная посыпка"]
  },
  {
    id: "berry-mors",
    category: "drink",
    name: "Морс ягодный",
    description: "Домашний ягодный морс, прохладный и не слишком сладкий.",
    price: 160,
    visual: "🥤",
    badges: ["холодный"],
    ingredients: ["ягоды", "вода", "сахар"],
    featured: true
  },
  {
    id: "cappuccino",
    category: "drink",
    name: "Капучино",
    description: "Классический кофе с молочной пеной для спокойного начала дня.",
    price: 180,
    visual: "☕",
    badges: ["кофе"],
    ingredients: ["эспрессо", "молоко"]
  },
  {
    id: "latte",
    category: "drink",
    name: "Латте",
    description: "Мягкий молочный кофе с бархатной текстурой.",
    price: 190,
    visual: "☕",
    badges: ["мягкий"],
    ingredients: ["эспрессо", "молоко"]
  },
  {
    id: "tea",
    category: "drink",
    name: "Чай",
    description: "Чёрный, зелёный или травяной чай к десертам и завтракам.",
    price: 120,
    visual: "🫖",
    badges: ["горячий"],
    ingredients: ["чай"]
  }
];

export const getProductById = (id) => MENU.find((product) => product.id === id);

export const getUpsellProducts = () =>
  MENU.filter((product) => ["drink", "dessert"].includes(product.category)).slice(0, 5);
