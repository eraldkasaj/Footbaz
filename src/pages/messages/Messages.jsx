import "./Messages.css";

function Messages() {
  return (
    <section className="messages-page">

      <div className="messages-container">

        <h1>Mesazhet</h1>

        <p>
          Këtu do të komunikosh me scoutët.
        </p>

        <div className="chat-list">

          <div className="chat-card">
            <h3>Marco Rossi</h3>
            <span>Scout - Hellas Verona</span>

            <p>
              Përshëndetje! Do të doja të shihja videot e tua.
            </p>

            <button>Hap Bisedën</button>
          </div>

          <div className="chat-card">
            <h3>Arben Kola</h3>
            <span>Scout - FK Partizani</span>

            <p>
              Faleminderit për aplikimin.
            </p>

            <button>Hap Bisedën</button>
          </div>

        </div>

      </div>

    </section>
  );
}

export default Messages;