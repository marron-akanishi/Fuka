# Fuka
FANZA アダルトPCゲーム（有料）フロアを便利にするChrome拡張機能

## 機能一覧

- サイドバーにある購入済みに件数を表示
- 各画面で購入済みかどうかを表示
  - 一覧画面
  - ランキング画面
  - 詳細画面
  - まとめ買い画面
    - 上記2つの画面はFANZA側でも購入表示されるが、手動登録用に対応
- 設定画面で以下のことが可能
  - ストレージに保持されている商品の削除（全削除、単一削除）
  - パッケージで購入した際の手動追加（単一、CSVによる一括）
- Chrome のサイドパネルにお気に入り一覧を表示
  - 現在はお気に入りリスト画面から手動で取得して更新する必要あり

## 使い方

1. Chromeにパッケージ化されていない拡張機能として登録
2. FANZAの購入済み商品一覧にアクセスし、所持リスト更新ボタンを押下する  
3. 各商品の左上にチェックが表示されたことを確認
4. 購入済み商品一覧の各ページで2と3を実行（最初のみ）
5. 機能一覧に表示されている内容が使えるようになる
6. 新たに商品を購入した場合は2と3を実行

## 備考

- ChromeのStorageに購入済み一覧から取得した情報を保持することで実現している
- Storageは容量の関係でGoogleアカウントによる同期していない
- 拡張機能のアイコンを押下することでStorageに保持されているタイトルの確認とStorageの初期化が可能
- 購入済み一覧に表示されているチェックはStorageにあるかどうかを表示しているため、表示されていない商品は正しく購入判定がされない
- 購入済み商品一覧を一括で取得することも考えたが、面倒なのと1ページ目以外は導入時のみでいいため各ページで行うことにしている
  - FANZA側の更新により1ページあたりの表示量が大幅に増えたため、面倒さは無くなっている
- **FANZAのDOMがかなり複雑であるため、急に動かなくなる可能性あり**
