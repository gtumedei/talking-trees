const Page = () => {
  return (
    <div className="tw:container tw:max-w-4xl tw:p-6 tw:mx-auto">
      <h1>Tests</h1>
      <ul>
        <li>
          Test 1:{" "}
          <a href="/?test=1&variant=narrativo" target="_blank">
            narrativo
          </a>
          ,{" "}
          <a href="/?test=1&variant=scientifico" target="_blank">
            scientifico
          </a>
          ,{" "}
          <a href="/?test=1" target="_blank">
            statico
          </a>
        </li>
        <li>
          Test 2:{" "}
          <a href="/?test=2&variant=narrativo" target="_blank">
            narrativo
          </a>
          ,{" "}
          <a href="/?test=2&variant=scientifico" target="_blank">
            scientifico
          </a>
          ,{" "}
          <a href="/?test=2" target="_blank">
            statico
          </a>
        </li>
        <li>
          Test 3:{" "}
          <a href="/?test=3&variant=narrativo" target="_blank">
            narrativo
          </a>
          ,{" "}
          <a href="/?test=3&variant=scientifico" target="_blank">
            scientifico
          </a>
          ,{" "}
          <a href="/?test=3" target="_blank">
            statico
          </a>
        </li>
        <li>
          Test 4:{" "}
          <a href="/?test=4&variant=narrativo" target="_blank">
            narrativo
          </a>
          ,{" "}
          <a href="/?test=4&variant=scientifico" target="_blank">
            scientifico
          </a>
          ,{" "}
          <a href="/?test=4" target="_blank">
            statico
          </a>
        </li>
      </ul>
    </div>
  )
}

export default Page
