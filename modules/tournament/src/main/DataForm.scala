package lila.tournament

import cats.implicits._
import shogi.format.forsyth.Sfen
import shogi.{ Mode, StartingPosition }
import org.joda.time.DateTime
import play.api.data._
import play.api.data.Forms._
import play.api.data.validation
import play.api.data.validation.{ Constraint, Constraints }
import scala.util.chaining._

import lila.common.Form._
import lila.hub.LightTeam._
import lila.user.User

final class DataForm {

  import DataForm._

  def create(user: User, teamBattleId: Option[TeamID] = None) =
    form(user, none) fill TournamentSetup(
      name = teamBattleId.isEmpty option user.titleUsername,
      clockTime = clockTimeDefault,
      clockIncrement = clockIncrementDefault,
      clockByoyomi = clockByoyomiDefault,
      periods = periodsDefault,
      minutes = minuteDefault,
      waitMinutes = waitMinuteDefault.some,
      startDate = none,
      variant = shogi.variant.Standard.id.toString.some,
      position = None,
      password = None,
      mode = none,
      rated = true.some,
      conditions = Condition.DataForm.AllSetup.default,
      teamBattleByTeam = teamBattleId,
      berserkable = true.some,
      streakable = true.some,
      description = none,
      hasChat = true.some
    )

  def edit(user: User, tour: Tournament) =
    form(user, tour.some) fill TournamentSetup(
      name = tour.name.some,
      clockTime = tour.clock.limitInMinutes,
      clockIncrement = tour.clock.incrementSeconds,
      clockByoyomi = tour.clock.byoyomiSeconds,
      periods = tour.clock.periodsTotal,
      minutes = tour.minutes,
      waitMinutes = none,
      startDate = tour.startsAt.some,
      variant = tour.variant.id.toString.some,
      position = tour.position,
      mode = none,
      rated = tour.mode.rated.some,
      password = tour.password,
      conditions = Condition.DataForm.AllSetup(tour.conditions),
      teamBattleByTeam = none,
      berserkable = tour.berserkable.some,
      streakable = tour.streakable.some,
      description = tour.description,
      hasChat = tour.hasChat.some
    )

  private val nameType = cleanText.verifying(
    Constraints minLength 2,
    Constraints maxLength 30,
    Constraints.pattern(
      regex = """[\p{L}\p{N}-\s:,;]+""".r,
      error = "error.unknown"
    ),
    Constraint[String] { (t: String) =>
      if (t.toLowerCase contains "lishogi")
        validation.Invalid(validation.ValidationError("Must not contain \"lishogi\""))
      else validation.Valid
    }
  )

  private def form(user: User, prev: Option[Tournament]) =
    Form {
      makeMapping(user) pipe { m =>
        prev.fold(m) { tour =>
          m
            .verifying(
              "Can't change variant after players have joined",
              _.realVariant == tour.variant || tour.nbPlayers == 0
            )
            .verifying(
              "Can't change time control after players have joined",
              _.speed == tour.speed || tour.nbPlayers == 0
            )
        }
      }
    }

  private def makeMapping(user: User) =
    mapping(
      "name"           -> optional(nameType),
      "clockTime"      -> numberInDouble(clockTimeChoices),
      "clockIncrement" -> numberIn(clockIncrementChoices),
      "clockByoyomi"   -> numberIn(clockByoyomiChoices),
      "periods"        -> numberIn(periodsChoices),
      "minutes" -> {
        if (lila.security.Granter(_.ManageTournament)(user)) number
        else numberIn(minuteChoices)
      },
      "waitMinutes"      -> optional(numberIn(waitMinuteChoices)),
      "startDate"        -> optional(inTheFuture(ISODateTimeOrTimestamp.isoDateTimeOrTimestamp)),
      "variant"          -> optional(text.verifying(v => guessVariant(v).isDefined)),
      "position"         -> optional(lila.common.Form.sfen.clean),
      "mode"             -> optional(number.verifying(Mode.all.map(_.id) contains _)), // deprecated, use rated
      "rated"            -> optional(boolean),
      "password"         -> optional(nonEmptyText),
      "conditions"       -> Condition.DataForm.all,
      "teamBattleByTeam" -> optional(nonEmptyText),
      "berserkable"      -> optional(boolean),
      "streakable"       -> optional(boolean),
      "description"      -> optional(cleanNonEmptyText),
      "hasChat"          -> optional(boolean)
    )(TournamentSetup.apply)(TournamentSetup.unapply)
      .verifying("Invalid clock", _.validClock)
      .verifying("Invalid starting position", _.validPosition)
      .verifying("Games with this time control cannot be rated", _.validRatedVariant)
      .verifying("Increase tournament duration, or decrease game clock", _.sufficientDuration)
      .verifying("Reduce tournament duration, or increase game clock", _.excessiveDuration)
}

object DataForm {

  import shogi.variant._

  val clockTimes: Seq[Double] = Seq(0d, 1 / 4d, 1 / 2d, 3 / 4d, 1d, 3 / 2d) ++ {
    (2 to 7 by 1) ++ (10 to 30 by 5) ++ (40 to 60 by 10)
  }.map(_.toDouble)
  val clockTimeDefault = 2d
  private def formatLimit(l: Double) =
    shogi.Clock.Config(l * 60 toInt, 0, 0, 1).limitString + {
      if (l <= 1) " minute" else " minutes"
    }
  val clockTimeChoices = optionsDouble(clockTimes, formatLimit)

  val clockIncrements       = (0 to 2 by 1) ++ (3 to 7) ++ (10 to 30 by 5) ++ (40 to 60 by 10)
  val clockIncrementDefault = 0
  val clockIncrementChoices = options(clockIncrements, "%d second{s}")

  val clockByoyomi        = (0 to 2 by 1) ++ (3 to 7) ++ (10 to 30 by 5) ++ (40 to 60 by 10)
  val clockByoyomiDefault = 0
  val clockByoyomiChoices = options(clockByoyomi, "%d second{s}")

  val periods        = 1 to 5
  val periodsDefault = 1
  val periodsChoices = options(periods, "%d period{s}")

  val minutes       = (20 to 60 by 5) ++ (70 to 120 by 10) ++ (150 to 360 by 30) ++ (420 to 600 by 60) :+ 720
  val minuteDefault = 45
  val minuteChoices = options(minutes, "%d minute{s}")

  val waitMinutes       = Seq(1, 2, 3, 5, 10, 15, 20, 30, 45, 60)
  val waitMinuteChoices = options(waitMinutes, "%d minute{s}")
  val waitMinuteDefault = 5

  val positions = StartingPosition.allWithInitial.map(_.sfen)
  val positionChoices = StartingPosition.allWithInitial.map { p =>
    p.sfen -> p.fullName
  }
  val positionDefault = StartingPosition.initial.sfen

  val validVariants =
    List(Standard, Minishogi)

  def guessVariant(from: String): Option[Variant] =
    validVariants.find { v =>
      v.key == from || from.toIntOption.exists(v.id ==)
    }
}

private[tournament] case class TournamentSetup(
    name: Option[String],
    clockTime: Double,
    clockIncrement: Int,
    clockByoyomi: Int,
    periods: Int,
    minutes: Int,
    waitMinutes: Option[Int],
    startDate: Option[DateTime],
    variant: Option[String],
    position: Option[Sfen],
    mode: Option[Int], // deprecated, use rated
    rated: Option[Boolean],
    password: Option[String],
    conditions: Condition.DataForm.AllSetup,
    teamBattleByTeam: Option[String],
    berserkable: Option[Boolean],
    streakable: Option[Boolean],
    description: Option[String],
    hasChat: Option[Boolean]
) {

  def validClock = (clockTime + clockIncrement) > 0 || (clockTime + clockByoyomi) > 0

  def validPosition = position.fold(true) { sfen =>
    sfen.toSituation(realVariant).exists(_.playable(strict = true, withImpasse = true))
  }

  def realMode =
    if (position.filterNot(_.initialOf(realVariant)).isDefined) Mode.Casual
    else Mode(rated.orElse(mode.map(Mode.Rated.id ===)) | true)

  def realVariant = variant.flatMap(DataForm.guessVariant) | shogi.variant.Standard

  def clockConfig = shogi.Clock.Config((clockTime * 60).toInt, clockIncrement, clockByoyomi, periods)

  def speed = shogi.Speed(clockConfig)

  def validRatedVariant =
    realMode == Mode.Casual ||
      lila.game.Game.allowRated(position, clockConfig.some, realVariant)

  def sufficientDuration = estimateNumberOfGamesOneCanPlay >= 3
  def excessiveDuration  = estimateNumberOfGamesOneCanPlay <= 150

  def isPrivate = password.isDefined || conditions.teamMember.isDefined

  private def estimateNumberOfGamesOneCanPlay: Double = (minutes * 60) / estimatedGameSeconds

  // There are 2 players, and they don't always use all their time (0.8)
  // add 15 seconds for pairing delay
  private def estimatedGameSeconds: Double = {
    (60 * clockTime + 30 * clockIncrement + clockByoyomi * 20 * periods) * 2 * 0.8
  } + 15
}
