import { forkJoin, Subscription } from 'rxjs'
import { first, tap } from 'rxjs/operators'
import { Component, ComponentFactoryResolver, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService, ConfirmService, LocalStorageService, Notifier, ScreenService, ServerService, UserService } from '@app/core'
import { immutableAssign } from '@app/helpers'
import { Account, AccountService, VideoService } from '@app/shared/shared-main'
import { AbstractVideoList } from '@app/shared/shared-video-miniature'
import { VideoFilter } from '@shared/models'

@Component({
  selector: 'my-account-videos',
  templateUrl: '../../shared/shared-video-miniature/abstract-video-list.html',
  styleUrls: [
    '../../shared/shared-video-miniature/abstract-video-list.scss'
  ]
})
export class AccountVideosComponent extends AbstractVideoList implements OnInit, OnDestroy {
  titlePage: string
  loadOnInit = false
  loadUserVideoPreferences = true

  filter: VideoFilter = null

  private account: Account
  private accountSub: Subscription

  constructor (
    protected router: Router,
    protected serverService: ServerService,
    protected route: ActivatedRoute,
    protected authService: AuthService,
    protected userService: UserService,
    protected notifier: Notifier,
    protected confirmService: ConfirmService,
    protected screenService: ScreenService,
    protected storageService: LocalStorageService,
    private accountService: AccountService,
    private videoService: VideoService,
    protected cfr: ComponentFactoryResolver
  ) {
    super()
  }

  ngOnInit () {
    super.ngOnInit()

    this.enableAllFilterIfPossible()

    // Parent get the account for us
    this.accountSub = forkJoin([
      this.accountService.accountLoaded.pipe(first()),
      this.onUserLoadedSubject.pipe(first())
    ]).subscribe(([ account ]) => {
      this.account = account

      this.reloadVideos()
      this.generateSyndicationList()
    })
  }

  ngOnDestroy () {
    if (this.accountSub) this.accountSub.unsubscribe()

    super.ngOnDestroy()
  }

  getVideosObservable (page: number) {
    const newPagination = immutableAssign(this.pagination, { currentPage: page })
    const options = {
      account: this.account,
      videoPagination: newPagination,
      sort: this.sort,
      nsfwPolicy: this.nsfwPolicy,
      videoFilter: this.filter
    }

    return this.videoService
               .getAccountVideos(options)
               .pipe(
                 tap(({ total }) => {
                   this.titlePage = $localize`Published ${total} videos`
                 })
               )
  }

  toggleModerationDisplay () {
    this.filter = this.buildLocalFilter(this.filter, null)

    this.reloadVideos()
  }

  generateSyndicationList () {
    this.syndicationItems = this.videoService.getAccountFeedUrls(this.account.id)
  }

  displayAsRow () {
    return this.screenService.isInMobileView()
  }
}
