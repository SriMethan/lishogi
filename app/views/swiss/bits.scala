package views.html.swiss

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.i18n.{ I18nKeys => trans }
import lila.swiss.Swiss

import controllers.routes

object bits {

  def link(swiss: Swiss): Frag      = link(swiss.id, swiss.name)
  def link(swissId: Swiss.Id): Frag = link(swissId, idToName(swissId))
  def link(swissId: Swiss.Id, name: String): Frag =
    a(
      dataIcon := "g",
      cls := "text",
      href := routes.Page.notSupported.url
    )(name)

  def idToName(id: Swiss.Id): String = env.swiss.getName(id) getOrElse "Tournament"
  def iconChar(swiss: Swiss): String = swiss.perfType.fold('g')(_.iconChar).toString

  def notFound()(implicit ctx: Context) =
    views.html.base.layout(
      title = trans.tournamentNotFound.txt()
    ) {
      main(cls := "page-small box box-pad")(
        h1(trans.tournamentNotFound()),
        p(trans.tournamentDoesNotExist()),
        p(trans.tournamentMayHaveBeenCanceled()),
        br,
        br,
        a(href := routes.Tournament.home)(trans.returnToTournamentsHomepage())
      )
    }

  def forTeam(swisses: List[Swiss])(implicit ctx: Context) =
    table(cls := "slist")(
      tbody(
        swisses map { s =>
          tr(
            cls := List(
              "enterable" -> s.isNotFinished,
              "soon"      -> s.isNowOrSoon
            )
          )(
            td(cls := "icon")(iconTag(iconChar(s))),
            td(cls := "header")(
              a(href := routes.Page.notSupported)(
                span(cls := "name")(s.name),
                span(cls := "setup")(
                  s.clock.show,
                  " • ",
                  if (!s.variant.standard) s.variant.name else s.perfType.map(_.trans),
                  " • ",
                  if (s.settings.rated) trans.ratedTournament() else trans.casualTournament(),
                  " • ",
                  s.estimatedDurationString
                )
              )
            ),
            td(cls := "infos")(
              momentFromNowOnce(s.startsAt)
            ),
            td(cls := "text", dataIcon := "r")(s.nbPlayers.localize)
          )
        }
      )
    )

  def showInterval(s: Swiss): Frag =
    s.settings.dailyInterval match {
      case Some(1)                         => frag("One round per day")
      case Some(d)                         => frag(s"One round every $d days")
      case None if s.settings.manualRounds => frag("Rounds are started manually")
      case None =>
        frag(
          if (s.settings.intervalSeconds < 60) pluralize("second", s.settings.intervalSeconds)
          else pluralize("minute", s.settings.intervalSeconds / 60),
          " between rounds"
        )
    }

  def jsI18n(implicit ctx: Context) = i18nJsObject(i18nKeys)

  private val i18nKeys = List(
    trans.join,
    trans.withdraw,
    trans.youArePlaying,
    trans.joinTheGame,
    trans.signIn,
    trans.averageElo,
    trans.gamesPlayed,
    trans.whiteWins,
    trans.blackWins,
    trans.draws,
    trans.winRate,
    trans.performance,
    trans.standByX,
    trans.averageOpponent,
    trans.tournamentComplete
  ).map(_.key)
}
