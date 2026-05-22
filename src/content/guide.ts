export type GuideBlock = {
  type: 'text'
  paragraphs: string[]
}

export type GuideImage = {
  src: string
  alt: string
  caption?: string
}

export type GuideSection = {
  id: string
  title: string
  blocks: GuideBlock[]
  image?: GuideImage
  images?: GuideImage[]
  tips?: string[]
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'overview',
    title: 'Synqa とは',
    blocks: [
      {
        type: 'text',
        paragraphs: [
          'Synqa（シンカ）は、スマートフォンから出勤・退勤を打刻し、勤務時間や残業を確認できる勤怠管理アプリです。',
          'GPS で位置を記録し、会社ごとにデータを分けて管理します。ブラウザまたはホーム画面に追加した PWA として利用できます。',
        ],
      },
    ],
    image: {
      src: '/guide/overview.jpg',
      alt: 'Synqa の概要画面',
      caption: '打刻と管理を、ひとつのアプリで',
    },
  },
  {
    id: 'account',
    title: 'ログイン・会社の登録',
    blocks: [
      {
        type: 'text',
        paragraphs: [
          '初めて使う会社の方は「新規会社」で会社コードと会社名を登録します。すでに会社がある場合は「参加」で会社コードを入力して参加します。',
          '登録後は「ログイン」タブから、登録したメールとパスワードで入ります。',
        ],
      },
    ],
    image: {
      src: '/guide/login.jpg',
      alt: 'ログイン画面のスクリーンショット',
      caption: 'ログイン / 新規会社 / 参加 の3タブ',
    },
    tips: [
      '会社コードは英数字とハイフン（例: asahi-home）です。',
      '同じ会社コードを知っているメンバーが「参加」できます。',
    ],
  },
  {
    id: 'menu',
    title: 'ログイン後のメニュー',
    blocks: [
      {
        type: 'text',
        paragraphs: [
          'ログインすると、まず「打刻」と「管理者」の2つから選ぶ画面が表示されます。',
          '日々の出勤・退勤だけなら「打刻」、勤務データの確認や設定は「管理者」を選びます。',
        ],
      },
    ],
    image: {
      src: '/guide/menu.jpg',
      alt: 'メニュー画面のスクリーンショット',
      caption: '打刻モードと管理者モード',
    },
  },
  {
    id: 'punch',
    title: '打刻の使い方',
    blocks: [
      {
        type: 'text',
        paragraphs: [
          '打刻画面で「打刻する担当」を選び、「出勤」または「退勤」をタップします。位置情報の取得には HTTPS での接続が必要です。',
          '画面下部には、本日の出勤中・退勤済みの一覧が表示されます。休憩時間は会社設定に従い自動で控除されます。',
        ],
      },
    ],
    image: {
      src: '/guide/punch.jpg',
      alt: '打刻画面のスクリーンショット',
      caption: '担当選択 → 出勤 / 退勤',
    },
    tips: [
      '左上の「メニュー」から、打刻・管理者の選択画面に戻れます。',
      'ヘッダーの「更新」で最新の打刻状況を読み込みます。',
    ],
  },
  {
    id: 'punch-settings',
    title: '打刻画面の設定（歯車）',
    blocks: [
      {
        type: 'text',
        paragraphs: [
          '打刻画面の右上、更新・退出ボタンの下にある歯車アイコンから、打刻ユーザーの追加・表示名の変更・削除ができます。パスワードは不要です。',
          '「自分の打刻担当」で、ログインしたあなたがどの名前で打刻するかを設定できます。',
        ],
      },
    ],
    image: {
      src: '/guide/punch-settings.jpg',
      alt: '打刻設定画面のスクリーンショット',
      caption: '⚙ からユーザー管理',
    },
  },
  {
    id: 'admin',
    title: '管理者モード',
    blocks: [
      {
        type: 'text',
        paragraphs: [
          '管理者を選ぶとパスワード入力画面が表示されます。会社設定で設定した管理者パスワードを入力すると、管理画面に入れます。',
          '下部タブの「勤務・残業」で週次・月次・年次の確認と CSV（Excel）出力、「会社設定」で勤務ルール・社員・打刻修正・画面の色などを変更できます。',
        ],
      },
    ],
    images: [
      {
        src: '/guide/admin-1.jpg',
        alt: '管理者モード①のスクリーンショット',
        caption: '① 勤務・残業（確認・CSV出力）',
      },
      {
        src: '/guide/admin-2.jpg',
        alt: '管理者モード②のスクリーンショット',
        caption: '② 会社設定（社員・修正・色など）',
      },
    ],
    tips: [
      '打刻の手動修正は「会社設定 → 修正」タブで行います。',
      '管理者パスワードは「会社設定 → 期間」タブで変更できます。',
    ],
  },
  {
    id: 'export',
    title: 'Excel（CSV）出力',
    blocks: [
      {
        type: 'text',
        paragraphs: [
          '管理者 → 勤務・残業 → 「CSV 出力」で、給与計算用のファイルをダウンロードできます。',
          'ファイルにはユーザーごとの月次合計に加え、日別の打刻ログ（出勤・退勤時刻・実働・残業）も含まれます。Excel で開いて確認できます。',
        ],
      },
    ],
    image: {
      src: '/guide/csv.jpg',
      alt: 'CSV出力画面のスクリーンショット',
      caption: '月次合計と打刻ログが1ファイルに',
    },
  },
  {
    id: 'theme',
    title: '画面の色を変える',
    blocks: [
      {
        type: 'text',
        paragraphs: [
          '管理者 → 会社設定 → 「色」タブで、ヘッダーやボタンのメインカラー・アクセントカラーを変更できます。初期値は Synqa 標準の青とティールです。',
          '保存すると、同じ会社の全員の画面に反映されます。',
        ],
      },
    ],
  },
]
